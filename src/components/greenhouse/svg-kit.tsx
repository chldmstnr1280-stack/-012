/**
 * Small, deterministic SVG building blocks used to paint the greenhouse.
 * Everything is seeded so server and client render identical markup.
 */

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Leaf pointing straight up from the origin. */
export function leafPath(length: number, width: number) {
  const L = length;
  const W = width;
  return `M0 0 C ${r2(-W)} ${r2(-L * 0.28)} ${r2(-W * 0.85)} ${r2(-L * 0.78)} 0 ${r2(-L)} C ${r2(W * 0.85)} ${r2(-L * 0.78)} ${r2(W)} ${r2(-L * 0.28)} 0 0Z`;
}

export const GREENS = ["#9fbf83", "#b5cf96", "#87ad72", "#c4d9a6", "#7c9f69", "#a8c78d"];
export const DEEP_GREENS = ["#6f9461", "#7fa36d", "#5f8455", "#8bb07a"];

interface ClusterProps {
  cx: number;
  cy: number;
  count: number;
  spread: number;
  size?: number;
  seed: number;
  /** angle range in degrees, 0 = up */
  angle?: [number, number];
  palette?: string[];
  opacity?: number;
}

export function LeafCluster({ cx, cy, count, spread, size = 16, seed, angle = [-80, 80], palette = GREENS, opacity = 1 }: ClusterProps) {
  const rnd = mulberry32(seed);
  const leaves = Array.from({ length: count }, () => {
    const a = angle[0] + rnd() * (angle[1] - angle[0]);
    const len = size * (0.7 + rnd() * 0.6);
    return {
      x: r2(cx + (rnd() - 0.5) * spread),
      y: r2(cy + (rnd() - 0.5) * spread * 0.45),
      a: r2(a),
      d: leafPath(len, len * 0.42),
      vein: r2(-len * 0.85),
      fill: palette[Math.floor(rnd() * palette.length)],
    };
  });
  return (
    <g opacity={opacity}>
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.a})`}>
          <path d={l.d} fill={l.fill} />
          <path d={`M0 -1 L0 ${l.vein}`} stroke="#e9f2d8" strokeOpacity={0.5} strokeWidth={0.7} />
        </g>
      ))}
    </g>
  );
}

export function Vine({ x, y, length, seed, size = 9, opacity = 1 }: { x: number; y: number; length: number; seed: number; size?: number; opacity?: number }) {
  const rnd = mulberry32(seed);
  const bend = (rnd() - 0.5) * 18;
  const steps = Math.floor(length / 11);
  const leaves = Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / (steps + 1);
    const side = i % 2 === 0 ? -1 : 1;
    const len = size * (0.75 + rnd() * 0.5) * (1 - t * 0.35);
    return {
      x: r2(x + Math.sin(t * Math.PI) * bend),
      y: r2(y + t * length),
      a: r2(side * (110 + rnd() * 40)),
      d: leafPath(len, len * 0.5),
      fill: GREENS[Math.floor(rnd() * GREENS.length)],
    };
  });
  return (
    <g className="sway" opacity={opacity} style={{ animationDelay: `${-(seed % 7)}s` }}>
      <path d={`M${x} ${y} Q ${r2(x + bend * 1.6)} ${r2(y + length / 2)} ${x} ${y + length}`} stroke="#86a06e" strokeWidth={1.1} fill="none" />
      {leaves.map((l, i) => (
        <path key={i} d={l.d} fill={l.fill} transform={`translate(${l.x} ${l.y}) rotate(${l.a})`} />
      ))}
    </g>
  );
}

export function Flower({ x, y, r = 4, color = "#f4c6cf", center = "#f7e3a3" }: { x: number; y: number; r?: number; color?: string; center?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={0} cy={-r * 0.85} rx={r * 0.62} ry={r * 0.95} fill={color} transform={`rotate(${a})`} />
      ))}
      <circle r={r * 0.42} fill={center} />
    </g>
  );
}

export function Pot({ x, y, w = 26, h = 22, color = "#f1e6d6", rim = "#e3d3bc" }: { x: number; y: number; w?: number; h?: number; color?: string; rim?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M${-w / 2} ${-h} L${w / 2} ${-h} L${w * 0.38} 0 L${-w * 0.38} 0 Z`} fill={color} />
      <rect x={-w / 2 - 2} y={-h - 5} width={w + 4} height={6} rx={2} fill={rim} />
      <path d={`M${-w * 0.3} ${-h + 3} L${-w * 0.24} -3`} stroke="#fff" strokeOpacity={0.6} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

export function Books({ x, y, colors, widths }: { x: number; y: number; colors: string[]; widths: number[] }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {colors.map((c, i) => {
        const h = 9;
        const offset = (i + 1) * h;
        const w = widths[i] ?? 60;
        return (
          <g key={i}>
            <rect x={(i % 2) * 3 - w / 2} y={-offset} width={w} height={h} rx={2} fill={c} />
            <rect x={(i % 2) * 3 - w / 2 + 3} y={-offset + 2} width={w - 8} height={1.4} fill="#fff" opacity={0.55} />
          </g>
        );
      })}
    </g>
  );
}

export function Lantern({ x, y, scale = 1, chainTop = -400, id }: { x: number; y: number; scale?: number; chainTop?: number; id: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <line x1={0} y1={chainTop / scale} x2={0} y2={-40} stroke="#8a7458" strokeWidth={1.2} strokeDasharray="2.5 1.5" />
      <circle className="lantern-glow" r={70} fill={`url(#${id})`} />
      <circle cx={0} cy={-38} r={4} fill="none" stroke="#8a7458" strokeWidth={1.6} />
      <path d="M-18 -24 L0 -36 L18 -24 Z" fill="#9b8264" />
      <rect x={-19} y={-26} width={38} height={4} rx={1.5} fill="#86704f" />
      <rect x={-14} y={-22} width={28} height={40} rx={3} fill="#ffe8b0" />
      <rect className="lantern-glow" x={-14} y={-22} width={28} height={40} rx={3} fill="#fff6d8" opacity={0.85} />
      <ellipse cx={0} cy={2} rx={6} ry={10} fill="#fffbe9" />
      <path d="M-14 -22 V18 M14 -22 V18 M0 -22 V18 M-14 -2 H14" stroke="#a48b6b" strokeWidth={1.4} fill="none" opacity={0.75} />
      <rect x={-17} y={17} width={34} height={5} rx={2} fill="#86704f" />
      <path d="M-10 22 L10 22 L6 27 L-6 27 Z" fill="#9b8264" />
    </g>
  );
}
