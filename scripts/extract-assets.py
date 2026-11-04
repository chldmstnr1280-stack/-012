"""
Build web assets from the source art in assets-src/.

  python3 scripts/extract-assets.py      (needs: pillow, numpy, opencv-python-headless)

1. Selly body  -> public/assets/selly/selly-body.png
   * cut the main pose out of the character sheet using its alpha channel
   * drop the semi-transparent glow backdrop (the app draws its own aura)
   * erase the painted eyes + mouth (inpaint) so the live vector face can sit on top
   * place it on a square canvas matching Selly's 240-unit art space
     (body width = 172/240, feet bottom at y = 217/240)
2. Greenhouse  -> public/assets/greenhouse/greenhouse-bg.webp (white strip trimmed)

It prints the face layout to paste into src/lib/assets.ts.
"""
import os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src")
OUT = os.path.join(ROOT, "public", "assets")

# ---------- Selly ----------
CROP = (690, 100, 1090, 530)  # main pose in the sheet
sheet = Image.open(os.path.join(SRC, "selly-sheet.png")).convert("RGBA")
arr = np.array(sheet.crop(CROP))
rgb = arr[:, :, :3].copy()
alpha = arr[:, :, 3].astype(np.float32)

# face features = dark strokes inside the face box; keep only stroke-sized blobs (not cheeks)
lum = rgb.mean(axis=2)
box = np.zeros(lum.shape, np.uint8)
y0, y1, x0, x1 = 180, 232, 105, 325
box[y0:y1, x0:x1] = (lum[y0:y1, x0:x1] < 200).astype(np.uint8) * 255
n, lab, stats, cents = cv2.connectedComponentsWithStats(box)
mask = np.zeros_like(box)
features = []
for i in range(1, n):
    x, y, w, h, area = stats[i]
    if area > 150 and w > 30:
        mask[lab == i] = 255
        features.append((cents[i][0], cents[i][1], w))
features.sort()
assert len(features) == 3, features  # left eye, mouth, right eye
mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
bgr = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), mask, 9, cv2.INPAINT_TELEA)
soft = cv2.GaussianBlur(bgr, (0, 0), 3)
m = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 3)[..., None]
rgb = cv2.cvtColor((bgr * (1 - m) + soft * m).astype(np.uint8), cv2.COLOR_BGR2RGB)

# remove the glow backdrop but keep the fuzzy fur edge
a = np.clip((alpha - 110) / (235 - 110), 0, 1)
a = (a ** 0.8 * 255).astype(np.uint8)

ys, xs = np.where(alpha > 200)
bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
S = int(round((bx1 - bx0) * 240 / 172))
k = 240 / S
ox = int(round(S / 2 - (bx0 + bx1) / 2))
oy = int(round(217 / 240 * S - by1))
canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
canvas.paste(Image.fromarray(np.dstack([rgb, a])), (ox, oy))
os.makedirs(os.path.join(OUT, "selly"), exist_ok=True)

# split leaves into their own layers so they can sway / open with the breath.
# Leaves sit behind the head: take the two big green/yellow (low-blue) blobs in the upper
# part, grow them a little to include their rim light, and move those pixels to leaf layers.
C = np.array(canvas).astype(np.float32)
r, g, b, al = C[..., 0], C[..., 1], C[..., 2], C[..., 3]
upper = np.zeros((S, S), bool)
upper[: int(S * 0.45)] = True
seed = (((g - b) > 60) & (al > 128) & upper).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(seed)
order = sorted(range(1, n), key=lambda i: -stats[i, 4])[:2]
order.sort(key=lambda i: stats[i, 0])  # left, right
body = C.copy()
pivots = []
for name, i in zip(("left", "right"), order):
    m = (lab == i).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=3).astype(np.float32)
    m = cv2.GaussianBlur(m, (0, 0), 0.7) * upper
    leaf = C.copy()
    leaf[..., 3] = al * m
    body[..., 3] *= 1 - m
    Image.fromarray(leaf.astype(np.uint8)).save(os.path.join(OUT, "selly", f"selly-leaf-{name}.png"), optimize=True)
    ys_, xs_ = np.where(leaf[..., 3] > 128)
    low = ys_ > np.percentile(ys_, 92)  # base of the leaf = its lowest pixels
    pivots.append((xs_[low].mean() * k, ys_[low].mean() * k))
# keep only the main body blob (+ a fur margin) to drop stray wisps left by the leaves
solid = (body[..., 3] > 128).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(solid)
main = (lab == 1 + int(np.argmax(stats[1:, 4]))).astype(np.uint8)
keep = cv2.GaussianBlur(cv2.dilate(main, np.ones((3, 3), np.uint8), iterations=5).astype(np.float32), (0, 0), 2)
body[..., 3] *= np.clip(keep * 1.4, 0, 1)
Image.fromarray(body.astype(np.uint8)).save(os.path.join(OUT, "selly", "selly-body.png"), optimize=True)
print("leafPivots: [[%.1f, %.1f], [%.1f, %.1f]]" % (*pivots[0], *pivots[1]))

(lx, ly, lw), (mx, my, _), (rx, ry, _) = features
to240 = lambda x, y: ((x + ox) * k, (y + oy) * k)
le, mo, re = to240(lx, ly), to240(mx, my), to240(rx, ry)
print("canvas", S)
print(
    "sellyFace: { cx: %.1f, eyeY: %.1f, eyeDx: %.1f, mouthY: %.1f, scale: %.2f }"
    % ((le[0] + re[0]) / 2, (le[1] + re[1]) / 2, (re[0] - le[0]) / 2, mo[1], lw * k / 15)
)

# ---------- Greenhouse ----------
bg = Image.open(os.path.join(SRC, "greenhouse.png")).convert("RGB")
g = np.array(bg)
rows = np.where(g.min(axis=(1, 2)) < 245)[0]
bg = bg.crop((0, 0, bg.width, int(rows.max()) - 6))
os.makedirs(os.path.join(OUT, "greenhouse"), exist_ok=True)
bg.save(os.path.join(OUT, "greenhouse", "greenhouse-bg.webp"), quality=90, method=6)
print("greenhouse", bg.size)

# ---------- Grass island (Selly's seat), cut from the painted floor ----------
GX0, GY0, GX1, GY1 = 230, 940, 840, 1105
patch = np.array(bg.crop((GX0, GY0, GX1, GY1)).convert("RGB"))
h, w = patch.shape[:2]
yy, xx = np.mgrid[0:h, 0:w]
cx, cy, rx, ry = 535 - GX0, 1022 - GY0, 292, 74
d = np.sqrt(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)
alpha = (np.clip((1.0 - d) / 0.22, 0, 1) ** 1.2 * 255).astype(np.uint8)
Image.fromarray(np.dstack([patch, alpha])).save(os.path.join(OUT, "greenhouse", "grass-island.png"), optimize=True)
print("grass island", (w, h))
