"""
Greenhouse objects, flower stages and Selly poses → web assets.

  python3 scripts/extract-objects.py      (needs: pillow, numpy, opencv-python-headless)

The source PNGs have real alpha but their soft edges carry stray yellow/red
colour ("fringe"). For every asset we:
  * drop near-invisible pixels and re-curve the edge alpha
  * repaint semi-transparent edge pixels with the colour of the solid pixels
    next to them (inpainting), so edges blend cleanly on the light greenhouse
Outputs go to public/assets/{objects,flowers,selly}.
"""
import os
import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets-src")
OUT = os.path.join(ROOT, "public", "assets")


def defringe(img: Image.Image, lo=40, hi=225, keep_glow=False) -> Image.Image:
    a = np.array(img.convert("RGBA"))
    rgb = a[..., :3].copy()
    al = a[..., 3].astype(np.float32)
    solid = (al >= hi).astype(np.uint8)
    edge = ((al > 0) & (al < hi)).astype(np.uint8) * 255
    # colour of the nearest solid pixels
    fixed = cv2.inpaint(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), edge, 5, cv2.INPAINT_TELEA)
    fixed = cv2.cvtColor(fixed, cv2.COLOR_BGR2RGB)
    if keep_glow:
        # glow is part of the art: only tame saturated warm fringe, keep alpha
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        warm = ((hsv[..., 0] < 35) | (hsv[..., 0] > 165)) & (hsv[..., 1] > 150) & (al < hi)
        rgb[warm] = fixed[warm]
        al = np.where(al < 14, 0, al)
    else:
        rgb[edge > 0] = fixed[edge > 0]
        al = np.clip((al - lo) / (hi - lo), 0, 1) ** 0.9 * 255
        # remove specks not attached to the main shape
        n, lab, stats, _ = cv2.connectedComponentsWithStats((al > 128).astype(np.uint8))
        if n > 1:
            big = np.zeros(al.shape, bool)
            for i in range(1, n):
                if stats[i, 4] > 400:
                    big |= lab == i
            near = cv2.dilate(big.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
            al = al * near
    out = Image.fromarray(np.dstack([rgb, al.astype(np.uint8)]))
    return out.crop(out.getbbox())


def save(img: Image.Image, rel: str, max_side=640):
    path = os.path.join(OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    s = min(1, max_side / max(img.size))
    if s < 1:
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    img.save(path, optimize=True)
    print(rel, img.size)
    return img


def quadrants(img: Image.Image):
    w, h = img.size
    return [img.crop((x, y, x + w // 2, y + h // 2)) for y in (0, h // 2) for x in (0, w // 2)]


# ---------- objects ----------
save(defringe(Image.open(os.path.join(SRC, "calendar.png"))), "objects/calendar.png", 420)
save(defringe(Image.open(os.path.join(SRC, "orb.png")), keep_glow=True), "objects/orb.png", 480)
cushion = save(defringe(Image.open(os.path.join(SRC, "cushion.png"))), "objects/cushion.png", 560)

# cushion front rim: the part below the seat, drawn over Selly when she sits inside
c = np.array(cushion)
h, w = c.shape[:2]
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
# seat ellipse (pink area) — everything below its lower arc is "front"
cx, cy, rx, ry = w * 0.47, h * 0.47, w * 0.40, h * 0.27
below = (yy > cy + ry * np.sqrt(np.clip(1 - ((xx - cx) / rx) ** 2, 0, 1)) - h * 0.02) & (yy > h * 0.55)
soft = cv2.GaussianBlur(below.astype(np.float32), (0, 0), 2.5)
front = c.copy()
front[..., 3] = (front[..., 3] * soft).astype(np.uint8)
Image.fromarray(front).save(os.path.join(OUT, "objects/cushion-front.png"), optimize=True)
print("objects/cushion-front.png", (w, h))

# ---------- flower stages (seed, sprout, bud, bloom) ----------
for name, q in zip(["seed", "sprout", "bud", "bloom"], quadrants(Image.open(os.path.join(SRC, "flower-stages.png")))):
    save(defringe(q), f"flowers/white-{name}.png", 360)

# ---------- Selly poses (stand, sit, sleep, walk) ----------
for name, q in zip(["stand", "sit", "sleep", "walk"], quadrants(Image.open(os.path.join(SRC, "selly-poses.png")))):
    save(defringe(q), f"selly/pose-{name}.png", 420)

# ---------- leafless poses (for the seed stage) ----------
# Remove the green leaves, then round the head back out where they covered it:
# the top part of the body silhouette is completed with its convex hull and the
# new pixels are filled with nearby body colour.
heads = {}
for name in ["sit", "sleep"]:  # the side-walking pose does not survive leaf removal; seed Selly walks in her base art
    im = np.array(Image.open(os.path.join(OUT, f"selly/pose-{name}.png")).convert("RGBA"))
    rgb = im[..., :3].astype(np.int32)
    al = im[..., 3]
    ay = np.where(al > 128)[0]
    upper_band = np.zeros(al.shape, bool)
    upper_band[: ay.min() + int((ay.max() - ay.min()) * 0.62)] = True  # leaves only
    # bright glowing heart has red near 255; leaves do not
    leaf = ((rgb[..., 1] - rgb[..., 2]) > 38) & (rgb[..., 1] >= rgb[..., 0] - 12) & (rgb[..., 0] < 232) & (al > 20) & upper_band
    leaf = cv2.dilate(leaf.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2) > 0
    body = (al > 128) & ~leaf
    n, lab, stats, _ = cv2.connectedComponentsWithStats(body.astype(np.uint8))
    body = lab == 1 + int(np.argmax(stats[1:, 4]))
    ys, xs = np.where(body)
    top, bottom = ys.min(), ys.max()
    hull = cv2.convexHull(np.column_stack([xs, ys]).astype(np.int32))
    hull_mask = np.zeros(al.shape, np.uint8)
    cv2.fillConvexPoly(hull_mask, hull, 1)
    upper = np.zeros(al.shape, bool)
    upper[: top + int((bottom - top) * 0.45)] = True
    shape = body | ((hull_mask > 0) & upper)
    shape = cv2.morphologyEx(shape.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)) > 0
    fill = (shape & ~body).astype(np.uint8) * 255
    bgr = cv2.inpaint(cv2.cvtColor(im[..., :3], cv2.COLOR_RGB2BGR), fill | (leaf & shape).astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
    out_rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    a2 = cv2.GaussianBlur(shape.astype(np.float32), (0, 0), 1.2) * 255
    out = np.dstack([out_rgb, a2.astype(np.uint8)])
    Image.fromarray(out).save(os.path.join(OUT, f"selly/pose-{name}-bare.png"), optimize=True)
    # head top (where a seedling sprout sits), as fractions of the image
    ys2, xs2 = np.where(shape)
    t = ys2.min()
    cols = xs2[ys2 <= t + 6]
    heads[name] = (round(float(cols.mean()) / out.shape[1], 3), round(float(t) / out.shape[0], 3))
    print(f"selly/pose-{name}-bare.png", out.shape[1::-1], "head", heads[name])

# ---------- mood flowers: recolour the white petals (bud & bloom) ----------
# Petals = pale, low-saturation pixels above the soil; stamens, leaves and soil keep their colour.
EMOTION_HUES = {  # hue (0-179 OpenCV), saturation, lightness scale
    "happy": (24, 175, 0.93),
    "calm": (38, 120, 0.95),
    "sad": (106, 125, 0.9),
    "anxious": (134, 105, 0.88),
}
for stage in ["bud", "bloom"]:
    src = np.array(Image.open(os.path.join(OUT, f"flowers/white-{stage}.png")).convert("RGBA"))
    rgb, al = src[..., :3], src[..., 3]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    h_img = rgb.shape[0]
    rows = np.arange(h_img)[:, None]
    petal = (hsv[..., 1] < 70) & (hsv[..., 2] > 150) & (rows < h_img * 0.62) & (al > 0)
    # keep leaf highlights green: drop anything near green leaf pixels, then keep only big petal blobs
    green = ((hsv[..., 0] > 22) & (hsv[..., 0] < 50) & (hsv[..., 1] > 55) & (al > 0)).astype(np.uint8)
    petal &= cv2.dilate(green, np.ones((3, 3), np.uint8), iterations=4) == 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(petal.astype(np.uint8))
    keep = np.zeros_like(petal)
    for i in range(1, n):
        if st[i, 4] > 300:
            keep |= lab == i
    # grow over the pale outline of the petals (only where the image is drawn)
    keep = cv2.dilate(keep.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=3).astype(bool) & (al > 0) & (rows < h_img * 0.62)
    keep &= ~(cv2.dilate(green, np.ones((3, 3), np.uint8), iterations=1).astype(bool))
    keep &= ~((hsv[..., 0] < 22) & (hsv[..., 1] > 90))  # stamens stay golden
    petal = cv2.GaussianBlur(keep.astype(np.float32), (0, 0), 0.9)
    for name, (hue, sat, light) in EMOTION_HUES.items():
        out = hsv.copy()
        out[..., 0] = hue
        # deeper colour in the shaded folds, paler at the highlights
        shade = np.clip((255 - hsv[..., 2]) / 60, 0, 1)
        out[..., 1] = sat * (0.8 + 0.3 * shade)
        out[..., 2] = hsv[..., 2] * (light - 0.06 * shade)
        rec = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32)
        mix = (rgb * (1 - petal[..., None]) + rec * petal[..., None]).astype(np.uint8)
        Image.fromarray(np.dstack([mix, al])).save(os.path.join(OUT, f"flowers/{name}-{stage}.png"), optimize=True)
    print(f"flowers/*-{stage}.png recoloured")
