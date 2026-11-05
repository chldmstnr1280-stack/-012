import { Flower, LeafCluster, leafPath, mulberry32 } from "@/components/greenhouse/svg-kit";

/**
 * Code-drawn PLACEHOLDER layers for the walking scene — stand-ins until the real
 * path art arrives (see `walkArt` in lib/assets). Every tile is seamless: anything
 * near an edge is drawn again one tile-width over.
 */
type Tile = (w: number, h: number) => React.ReactNode;

const wrap = (x: number, w: number, node: (x: number) => React.ReactNode) => [node(x), node(x - w), node(x + w)];

export const farTile: Tile = (w, h) => {
  const rnd = mulberry32(3);
  const hills = (base: number, amp: number, n: number, phase: number) => {
    let d = `M0 ${h} L0 ${base}`;
    for (let i = 0; i <= 40; i++) {
      const x = (i / 40) * w;
      d += ` L${x.toFixed(1)} ${(base - Math.sin((i / 40) * Math.PI * 2 * n + phase) * amp - Math.sin((i / 40) * Math.PI * 2 * (n * 2) + phase * 2) * amp * 0.35).toFixed(1)}`;
    }
    return `${d} L${w} ${h} Z`;
  };
  const clouds = Array.from({ length: 4 }, () => ({ x: rnd() * w, y: h * (0.08 + rnd() * 0.22), s: 0.6 + rnd() * 0.8 }));
  return (
    <g>
      {clouds.map((c, i) =>
        wrap(c.x, w, (x) => (
          <g key={`${i}-${x}`} transform={`translate(${x} ${c.y}) scale(${c.s})`} opacity={0.85}>
            <ellipse cx={0} cy={0} rx={46} ry={16} fill="#fffaf6" />
            <ellipse cx={-22} cy={-8} rx={22} ry={16} fill="#fffaf6" />
            <ellipse cx={18} cy={-12} rx={26} ry={20} fill="#fffaf6" />
          </g>
        )),
      )}
      <path d={hills(h * 0.5, h * 0.035, 1, 0.4)} fill="#b9c6dd" opacity={0.75} />
      <path d={hills(h * 0.55, h * 0.03, 2, 1.7)} fill="#a8c3a6" opacity={0.85} />
      <rect y={h * 0.58} width={w} height={h * 0.06} fill="#cfe0ea" opacity={0.7} />
    </g>
  );
};

export const midTile: Tile = (w, h) => {
  const rnd = mulberry32(11);
  const horizon = h * 0.62;
  const trees = [0.18, 0.62].map((t) => ({ x: t * w, s: 0.9 + rnd() * 0.3 }));
  const bushes = Array.from({ length: 6 }, (_, i) => ({ x: ((i + 0.3) / 6) * w, s: 0.8 + rnd() * 0.5 }));
  return (
    <g>
      {trees.map((t, i) =>
        wrap(t.x, w, (x) => (
          <g key={`t${i}-${x}`} transform={`translate(${x} ${horizon}) scale(${t.s})`}>
            <path d="M-6 0 C -5 -60 -8 -110 -2 -150 L 4 -150 C 8 -110 6 -60 7 0 Z" fill="#9b7d5e" />
            <LeafCluster cx={0} cy={-170} count={34} spread={150} size={26} seed={20 + i} angle={[-180, 180]} />
            <LeafCluster cx={-30} cy={-140} count={16} spread={90} size={22} seed={30 + i} angle={[-180, 180]} />
          </g>
        )),
      )}
      {/* fence */}
      <rect y={horizon + 2} width={w} height={4} rx={2} fill="#c9a77f" />
      <rect y={horizon + 18} width={w} height={4} rx={2} fill="#c9a77f" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={(i / 7) * w} y={horizon - 8} width={7} height={40} rx={2} fill="#b8946b" />
      ))}
      {bushes.map((b, i) =>
        wrap(b.x, w, (x) => (
          <g key={`b${i}-${x}`} transform={`translate(${x} ${horizon + 34}) scale(${b.s})`}>
            <LeafCluster cx={0} cy={-6} count={22} spread={90} size={20} seed={40 + i} angle={[-100, 100]} />
            {[-26, -6, 16, 32].map((dx, k) => (
              <Flower key={k} x={dx} y={-14 - (k % 2) * 10} r={9} color={["#f4b8c9", "#f9d0dc", "#e9c6ef", "#ffffff"][k]} />
            ))}
          </g>
        )),
      )}
    </g>
  );
};

export const foreTile: Tile = (w, h) => {
  const rnd = mulberry32(17);
  const top = h * 0.72;
  const stones = Array.from({ length: 4 }, (_, i) => ({ x: ((i + 0.5) / 4) * w, y: h * (0.84 + (i % 2) * 0.06), r: 34 + rnd() * 16 }));
  const tufts = Array.from({ length: 10 }, (_, i) => ({ x: (i / 10) * w + rnd() * 20, front: i % 2 === 0 }));
  return (
    <g>
      <path d={`M0 ${top} C ${w * 0.3} ${top - 10} ${w * 0.7} ${top + 10} ${w} ${top} L${w} ${h} L0 ${h} Z`} fill="#e9dcc3" />
      <rect y={top + 4} width={w} height={h - top} fill="#e3d3b6" opacity={0.6} />
      {stones.map((s, i) =>
        wrap(s.x, w, (x) => <ellipse key={`s${i}-${x}`} cx={x} cy={s.y} rx={s.r} ry={s.r * 0.32} fill="#f4ece0" stroke="#d8c8ae" strokeWidth={2} />),
      )}
      {tufts.map((t, i) =>
        wrap(t.x, w, (x) => (
          <g key={`g${i}-${x}`} transform={`translate(${x} ${t.front ? h - 6 : top + 2})`}>
            {[-18, -6, 6, 16].map((a, k) => (
              <path key={k} d={leafPath(t.front ? 46 : 26, t.front ? 9 : 6)} fill={["#8fb46f", "#a3c582", "#7aa262", "#b5d394"][k]} transform={`rotate(${a})`} />
            ))}
            {t.front && <Flower x={8} y={-38} r={11} color="#f6c9d4" />}
          </g>
        )),
      )}
    </g>
  );
};
