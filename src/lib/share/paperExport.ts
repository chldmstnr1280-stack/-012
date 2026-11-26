/**
 * 진료용 요약을 파일로 — the on-screen summary drawn onto a canvas, then saved as
 * a PNG or as a PDF (A4 pages holding the picture). No libraries and no
 * `foreignObject` (which some WebViews refuse to export): the browser has
 * already laid the page out, so this copies boxes, borders and each character
 * at the position the browser put it. Everything happens on the device.
 */

const transparent = (c: string) => !c || c === "transparent" || /rgba\([^)]*,\s*0\)$/.test(c);

export function rasterize(el: HTMLElement, scale = 2): HTMLCanvasElement {
  // measure without CSS zoom so positions and font sizes agree
  const prevZoom = el.style.zoom;
  el.style.zoom = "1";
  try {
    const root = el.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(root.width * scale);
    canvas.height = Math.ceil(root.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.scale(scale, scale);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, root.width, root.height);
    const ox = root.left;
    const oy = root.top;

    // boxes: backgrounds, then borders
    const all = [el, ...Array.from(el.querySelectorAll<HTMLElement>("*"))];
    const visible = (e: Element) => {
      const s = getComputedStyle(e);
      return s.display !== "none" && s.visibility !== "hidden";
    };
    for (const e of all) {
      if (!visible(e)) continue;
      const s = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const x = r.left - ox;
      const y = r.top - oy;
      if (!transparent(s.backgroundColor)) {
        ctx.fillStyle = s.backgroundColor;
        ctx.fillRect(x, y, r.width, r.height);
      }
      const sides: [string, string, string, number, number, number, number][] = [
        [s.borderTopStyle, s.borderTopColor, s.borderTopWidth, x, y, x + r.width, y],
        [s.borderBottomStyle, s.borderBottomColor, s.borderBottomWidth, x, y + r.height, x + r.width, y + r.height],
        [s.borderLeftStyle, s.borderLeftColor, s.borderLeftWidth, x, y, x, y + r.height],
        [s.borderRightStyle, s.borderRightColor, s.borderRightWidth, x + r.width, y, x + r.width, y + r.height],
      ];
      for (const [style, color, width, x1, y1, x2, y2] of sides) {
        const w = parseFloat(width);
        if (!w || style === "none" || style === "hidden" || transparent(color)) continue;
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.beginPath();
        const half = w / 2;
        const dx = x1 === x2 ? (x1 === x ? half : -half) : 0;
        const dy = y1 === y2 ? (y1 === y ? half : -half) : 0;
        ctx.moveTo(x1 + dx, y1 + dy);
        ctx.lineTo(x2 + dx, y2 + dy);
        ctx.stroke();
      }
    }

    // text: every character where the browser placed it
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    ctx.textBaseline = "middle";
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n as Text;
      const parent = t.parentElement;
      if (!parent || !t.data.trim() || !visible(parent)) continue;
      const s = getComputedStyle(parent);
      ctx.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      ctx.fillStyle = s.color;
      for (let i = 0; i < t.data.length; i++) {
        const ch = t.data[i];
        if (ch === " " || ch === "\n" || ch === "\t") continue;
        range.setStart(t, i);
        range.setEnd(t, i + 1);
        const r = range.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        ctx.fillText(ch, r.left - ox, r.top - oy + r.height / 2);
      }
    }
    return canvas;
  } finally {
    el.style.zoom = prevZoom;
  }
}

export const pngBase64 = (c: HTMLCanvasElement) => c.toDataURL("image/png").split(",")[1];

/** A4 portrait PDF, the picture cut into pages (JPEG inside, so it stays small). */
export function pdfBase64(c: HTMLCanvasElement): string {
  const W = 595.28;
  const H = 841.89;
  const margin = 24;
  const pxPerPt = c.width / (W - margin * 2);
  const sliceH = Math.floor((H - margin * 2) * pxPerPt);
  const pages: { jpeg: string; w: number; h: number }[] = [];
  const src = c.getContext("2d")!;
  /** cut where a row is blank, so no line of text is split between pages */
  const cutAt = (y: number) => {
    const end = y + sliceH;
    if (end >= c.height) return c.height;
    const look = Math.min(Math.floor(sliceH / 4), 400);
    const rows = src.getImageData(0, end - look, c.width, look).data;
    for (let r = look - 1; r >= 0; r--) {
      let blank = true;
      for (let x = 0; x < c.width; x += 3) {
        const i = (r * c.width + x) * 4;
        if (rows[i] < 235 || rows[i + 1] < 235 || rows[i + 2] < 235) {
          blank = false;
          break;
        }
      }
      if (blank) return end - look + r;
    }
    return end;
  };
  for (let y = 0; y < c.height; ) {
    const next = cutAt(y);
    const h = next - y;
    const part = document.createElement("canvas");
    part.width = c.width;
    part.height = h;
    const p = part.getContext("2d")!;
    p.fillStyle = "#fff";
    p.fillRect(0, 0, part.width, h);
    p.drawImage(c, 0, y, c.width, h, 0, 0, c.width, h);
    pages.push({ jpeg: atob(part.toDataURL("image/jpeg", 0.92).split(",")[1]), w: c.width, h });
    y = next;
  }

  // a minimal PDF: catalog, pages, and per page a page, its content stream and its image
  const objs: string[] = [];
  const kids: number[] = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  pages.forEach((pg, i) => {
    const pageId = 3 + i * 3;
    const contentId = pageId + 1;
    const imgId = pageId + 2;
    kids.push(pageId);
    const drawW = W - margin * 2;
    const drawH = pg.h / pxPerPt;
    const content = `q ${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${margin} ${(H - margin - drawH).toFixed(2)} cm /Im0 Do Q`;
    objs[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objs[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    objs[imgId] = `<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>\nstream\n${pg.jpeg}\nendstream`;
  });
  objs[2] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;

  let out = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  for (let i = 1; i < objs.length; i++) {
    offsets[i] = out.length;
    out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = out.length;
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objs.length; i++) out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // every character above is a single byte (latin-1), so btoa is safe
  return btoa(out);
}
