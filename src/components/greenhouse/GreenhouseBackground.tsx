import { greenhouseArt } from "@/lib/assets";
import { Books, DEEP_GREENS, Flower, LeafCluster, Lantern, Pot, Vine, mulberry32 } from "./svg-kit";
import { DustMotes } from "./DustMotes";

/**
 * 2.5D glass greenhouse. Painted as stacked SVG layers (back → front) so each
 * depth plane can later be swapped for bitmap art or a Three.js scene.
 * If `greenhouseArt` is set, the painted background is used instead of the vector layers.
 */
export function GreenhouseBackground({
  dim = false,
  anchor = "bottom",
  placement,
}: {
  dim?: boolean;
  anchor?: "top" | "bottom";
  /** exact placement of the painted image (world layout on the home screen) */
  placement?: { s: number; ox: number; oy: number };
}) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {greenhouseArt ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={greenhouseArt}
          alt=""
          decoding="async"
          fetchPriority="high"
          className={placement ? "absolute max-w-none" : "absolute inset-0 h-full w-full object-cover"}
          style={
            placement
              ? { left: placement.ox, top: placement.oy, width: 1086 * placement.s, height: 1301 * placement.s }
              : { objectPosition: anchor === "top" ? "50% 0%" : "50% 100%" }
          }
        />
      ) : (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 390 844" preserveAspectRatio={anchor === "top" ? "xMidYMin slice" : "xMidYMax slice"}>
          <Defs />
          <SkyLayer />
          <StructureLayer />
          <LightLayer />
          <InteriorLayer />
          <FloorLayer />
          <ForegroundLayer />
        </svg>
      )}
      <DustMotes />
      {/* vignette + readability veils */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_55%_45%,transparent_55%,rgba(70,54,34,0.5)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(70,62,50,0.3)] to-transparent" />
      <div
        className="absolute inset-0 bg-[#3e3428] transition-opacity duration-1000"
        style={{ opacity: dim ? 0.28 : 0 }}
      />
    </div>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a7ab9b" />
        <stop offset="0.2" stopColor="#cdc5b8" />
        <stop offset="0.4" stopColor="#ecd8bf" />
        <stop offset="0.56" stopColor="#ead4ae" />
        <stop offset="0.72" stopColor="#b8bf8c" />
        <stop offset="1" stopColor="#8e9f68" />
      </linearGradient>
      <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fffdf3" stopOpacity="1" />
        <stop offset="0.35" stopColor="#fff3d6" stopOpacity="0.85" />
        <stop offset="1" stopColor="#ffe9c4" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lanternGlowA" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff1c2" stopOpacity="0.95" />
        <stop offset="0.35" stopColor="#ffdc93" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffd58a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.22" />
      </linearGradient>
      <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fffbea" stopOpacity="0.85" />
        <stop offset="1" stopColor="#fff3d4" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e2cfb2" />
        <stop offset="1" stopColor="#c7ad8a" />
      </linearGradient>
      <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#cfc6a0" />
        <stop offset="0.35" stopColor="#b5b984" />
        <stop offset="1" stopColor="#8a9a62" />
      </linearGradient>
      <filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" /></filter>
      <filter id="blur4" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" /></filter>
      <filter id="blur8" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="8" /></filter>
      <filter id="blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
    </defs>
  );
}

/* ---------- 1. Sky & outside garden seen through the glass ---------- */
function SkyLayer() {
  const rnd = mulberry32(11);
  const blobs = Array.from({ length: 26 }, () => ({
    x: 100 + rnd() * 320,
    y: 360 + rnd() * 190,
    r: 22 + rnd() * 40,
    c: ["#9bb07f", "#8aa46f", "#b3c393", "#c9cfa6", "#7d9866"][Math.floor(rnd() * 5)],
  }));
  return (
    <g>
      <rect width="390" height="844" fill="url(#sky)" />
      {/* distant trees */}
      <g filter="url(#blur8)" opacity={0.92}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={b.c} />
        ))}
        <circle cx={160} cy={330} r={46} fill="#a9b68f" />
        <circle cx={390} cy={300} r={60} fill="#9fae86" />
      </g>
      {/* warm sun bloom */}
      <ellipse cx={268} cy={400} rx={190} ry={210} fill="url(#sun)" opacity={0.85} />
      <ellipse cx={268} cy={390} rx={70} ry={80} fill="#fff8e4" opacity={0.6} filter="url(#blur14)" />
    </g>
  );
}

/* ---------- 2. Greenhouse frame: dome ceiling, back wall arches, side wall ---------- */
const APEX = { x: 285, y: 150 };
const RAFTER_ENDS: [number, number][] = [
  [-60, 230], [-60, 110], [-30, -20], [60, -30], [150, -30], [235, -30], [320, -30], [410, -30], [450, 80], [450, 200],
];

function StructureLayer() {
  const frame = "#f0e3cc";
  const frameShade = "#a98d69";
  const lerp = (t: number, [x, y]: [number, number]) => [APEX.x + (x - APEX.x) * t, APEX.y + (y - APEX.y) * t];
  const purlins = [0.28, 0.52, 0.78].map((t) => RAFTER_ENDS.map((p) => lerp(t, p).map((n) => n.toFixed(1)).join(" ")).join(" L"));

  const mullions = [120, 172, 224, 276, 328, 380];
  const springY = 292;
  const peakY = 252;

  return (
    <g>
      {/* glass panes of the ceiling with soft reflection */}
      <path d={`M${APEX.x} ${APEX.y} ${RAFTER_ENDS.map(([x, y]) => `L${x} ${y}`).join(" ")} Z`} fill="url(#glass)" />

      {/* back wall: arched bays */}
      <g>
        <path d={`M100 ${springY - 30} L${APEX.x} ${APEX.y + 18} L420 ${springY - 40}`} stroke={frameShade} strokeWidth={7} fill="none" opacity={0.55} />
        <path d={`M100 ${springY - 30} L${APEX.x} ${APEX.y + 18} L420 ${springY - 40}`} stroke={frame} strokeWidth={5} fill="none" />
        {mullions.slice(0, -1).map((x, i) => {
          const x2 = mullions[i + 1];
          const mid = (x + x2) / 2;
          return (
            <g key={x}>
              <rect x={x} y={peakY} width={x2 - x} height={560 - peakY} fill="url(#glass)" />
              <path
                d={`M${x + 3} ${springY} Q ${x + 4} ${peakY + 8} ${mid} ${peakY} Q ${x2 - 4} ${peakY + 8} ${x2 - 3} ${springY}`}
                stroke={frame}
                strokeWidth={3}
                fill="none"
              />
              <path d={`M${mid} ${peakY} V560`} stroke={frame} strokeWidth={1.6} opacity={0.8} />
            </g>
          );
        })}
        {mullions.map((x) => (
          <g key={x}>
            <rect x={x - 3.5} y={springY - 44} width={7} height={560 - springY + 44} fill={frameShade} opacity={0.55} />
            <rect x={x - 2.5} y={springY - 44} width={5} height={560 - springY + 44} fill={frame} />
          </g>
        ))}
        {[springY, 420, 500].map((y) => (
          <g key={y}>
            <rect x={100} y={y - 2.5} width={300} height={5} fill={frame} />
            <rect x={100} y={y + 2.5} width={300} height={1.5} fill={frameShade} opacity={0.6} />
          </g>
        ))}
      </g>

      {/* left side wall (closer, bigger) */}
      <g>
        <path d="M18 760 V200 Q 22 128 66 118 Q 106 130 112 196 V760" fill="url(#glass)" />
        <path d="M18 760 V200 Q 22 128 66 118 Q 106 130 112 196 V760" stroke={frameShade} strokeWidth={9} fill="none" opacity={0.5} />
        <path d="M18 760 V200 Q 22 128 66 118 Q 106 130 112 196 V760" stroke={frame} strokeWidth={6} fill="none" />
        <path d="M65 118 V760 M18 300 H112" stroke={frame} strokeWidth={3} />
      </g>

      {/* dome rafters & purlins */}
      <g>
        {RAFTER_ENDS.map(([x, y], i) => (
          <g key={i}>
            <path d={`M${APEX.x} ${APEX.y} L${x} ${y}`} stroke={frameShade} strokeWidth={9} opacity={0.45} />
            <path d={`M${APEX.x} ${APEX.y} L${x} ${y}`} stroke={frame} strokeWidth={6.5} />
          </g>
        ))}
        {purlins.map((d, i) => (
          <path key={i} d={`M${d}`} stroke={frame} strokeWidth={2.4 + i} fill="none" opacity={0.9} />
        ))}
        <circle cx={APEX.x} cy={APEX.y} r={9} fill={frame} />
      </g>

      {/* right post */}
      <rect x={349} y={120} width={12} height={640} fill={frameShade} opacity={0.6} />
      <rect x={350} y={120} width={9} height={640} fill={frame} />
    </g>
  );
}

/* ---------- 3. Light shafts ---------- */
function LightLayer() {
  const rays = [
    { d: "M300 -20 L370 -20 L150 760 L60 760 Z", o: 0.26, delay: "0s" },
    { d: "M380 -20 L420 -20 L260 760 L200 760 Z", o: 0.2, delay: "-3s" },
    { d: "M215 -20 L245 -20 L70 700 L30 700 Z", o: 0.16, delay: "-6s" },
  ];
  return (
    <g style={{ mixBlendMode: "screen" }} filter="url(#blur8)">
      {rays.map((r, i) => (
        <path key={i} className="light-ray" d={r.d} fill="url(#ray)" opacity={r.o} style={{ animationDelay: r.delay }} />
      ))}
    </g>
  );
}

/* ---------- 4. Shelves, pots, books, lanterns, hanging vines ---------- */
function InteriorLayer() {
  return (
    <g>
      {/* hanging vines from the ceiling */}
      <Vine x={40} y={-10} length={180} seed={3} />
      <Vine x={92} y={20} length={150} seed={8} />
      <Vine x={150} y={40} length={110} seed={12} opacity={0.9} />
      <Vine x={210} y={70} length={90} seed={21} opacity={0.85} />
      <Vine x={330} y={50} length={140} seed={5} />
      <Vine x={372} y={10} length={200} seed={17} />
      <LeafCluster cx={30} cy={10} count={46} spread={170} size={24} seed={44} angle={[90, 270]} palette={DEEP_GREENS} />
      <LeafCluster cx={380} cy={0} count={40} spread={150} size={24} seed={45} angle={[90, 270]} palette={DEEP_GREENS} />
      <LeafCluster cx={60} cy={30} count={40} spread={150} size={18} seed={41} angle={[100, 260]} />
      <LeafCluster cx={330} cy={20} count={34} spread={140} size={17} seed={42} angle={[100, 260]} />
      <LeafCluster cx={210} cy={8} count={22} spread={160} size={14} seed={43} angle={[110, 250]} opacity={0.85} />

      {/* left shelves */}
      <g>
        <rect x={86} y={240} width={5} height={300} fill="#bfa47f" />
        {[{ y: 262, w: 128 }, { y: 352, w: 122 }, { y: 436, w: 108 }].map(({ y, w }) => (
          <g key={y}>
            <rect x={-6} y={y} width={w} height={8} rx={2} fill="url(#wood)" />
            <rect x={-6} y={y + 8} width={w} height={6} fill="#6c5640" opacity={0.18} filter="url(#blur2)" />
          </g>
        ))}
        {/* top shelf */}
        <Pot x={22} y={262} w={24} h={20} />
        <LeafCluster cx={22} cy={240} count={14} spread={30} size={15} seed={51} />
        <g transform="translate(44 232)">
          <rect width={34} height={30} rx={3} fill="#f3eadb" stroke="#c9b28f" strokeWidth={2.5} />
          <rect x={6} y={6} width={22} height={18} fill="#e6d8c3" />
        </g>
        <Pot x={98} y={262} w={18} h={15} color="#efe2e4" rim="#e2cfd2" />
        <LeafCluster cx={98} cy={246} count={8} spread={18} size={11} seed={52} />
        <Flower x={14} y={226} r={5} color="#e9d7ef" />
        <Flower x={26} y={218} r={4.5} color="#f2c9d4" />
        {/* middle shelf */}
        <Books x={24} y={352} colors={["#e8d7c3", "#cfd9c4", "#ead0cf"]} widths={[44, 40, 42]} />
        <g transform="translate(70 352)">
          <rect x={-12} y={-34} width={24} height={34} rx={3} fill="#f6efe2" stroke="#c9b28f" strokeWidth={2} />
          <path d="M-7 -28 h14 v22 h-14z" fill="#ebe0cd" />
        </g>
        <Pot x={102} y={352} w={20} h={16} />
        <LeafCluster cx={102} cy={334} count={10} spread={22} size={13} seed={53} />
        {/* bottom shelf with lantern */}
        <Pot x={88} y={436} w={22} h={18} color="#efe4ef" rim="#e1d2e2" />
        <LeafCluster cx={88} cy={416} count={12} spread={26} size={14} seed={54} />
        <Flower x={80} y={402} r={4.5} color="#dcd0ee" />
        <Flower x={95} y={398} r={4} color="#ffffff" />
      </g>

      {/* lanterns */}
      <Lantern id="lanternGlowA" x={38} y={412} scale={0.95} chainTop={-150} />
      <Lantern id="lanternGlowA" x={296} y={262} scale={0.78} chainTop={-150} />
      <Lantern id="lanternGlowA" x={350} y={226} scale={1.05} chainTop={-120} />

      {/* right side table */}
      <g>
        <rect x={286} y={470} width={120} height={8} rx={2} fill="url(#wood)" />
        <rect x={296} y={478} width={6} height={90} fill="#bea482" />
        <rect x={392} y={478} width={6} height={90} fill="#bea482" />
        <Pot x={334} y={470} w={30} h={26} />
        <LeafCluster cx={334} cy={440} count={24} spread={50} size={20} seed={61} />
        <Pot x={376} y={470} w={20} h={16} color="#efe2e4" rim="#e2cfd2" />
        <LeafCluster cx={376} cy={452} count={10} spread={22} size={13} seed={62} />
        <Books x={360} y={608} colors={["#e9d9c4", "#d6dfc9", "#ecd3d2", "#e6dccb"]} widths={[66, 60, 64, 58]} />
      </g>

      {/* left floor books */}
      <Books x={30} y={596} colors={["#e6d6c0", "#ead2d0", "#d5ddc7", "#efe5d5"]} widths={[72, 66, 70, 62]} />
    </g>
  );
}

/* ---------- 5. Floor & garden beds ---------- */
function FloorLayer() {
  const rnd = mulberry32(77);
  const flowers = Array.from({ length: 22 }, () => ({
    x: Math.round(rnd() * 390),
    y: Math.round(560 + rnd() * 70),
    r: 2.5 + rnd() * 2.5,
    c: ["#f4c6cf", "#ffffff", "#e3d5f0", "#f9dfb8"][Math.floor(rnd() * 4)],
  }));
  return (
    <g>
      <path d="M-10 548 Q 195 520 400 548 L400 844 L-10 844 Z" fill="url(#floor)" />
      {/* stone path glow */}
      <ellipse cx={200} cy={640} rx={170} ry={36} fill="#efdfb8" opacity={0.5} filter="url(#blur8)" />
      {/* background bushes on the floor line */}
      <LeafCluster cx={130} cy={556} count={30} spread={110} size={18} seed={71} opacity={0.85} />
      <LeafCluster cx={250} cy={552} count={26} spread={100} size={16} seed={72} opacity={0.8} />
      <LeafCluster cx={18} cy={560} count={20} spread={60} size={22} seed={73} palette={["#87ad72", "#9fbf83", "#6f9461"]} />
      <LeafCluster cx={390} cy={580} count={20} spread={60} size={24} seed={74} palette={["#87ad72", "#9fbf83", "#6f9461"]} />
      {flowers.map((f, i) => (
        <Flower key={i} x={f.x} y={f.y} r={f.r} color={f.c} />
      ))}
    </g>
  );
}

/* ---------- 6. Out-of-focus foreground for depth ---------- */
function ForegroundLayer() {
  return (
    <g>
      <g filter="url(#blur4)" opacity={0.95}>
        <LeafCluster cx={-6} cy={740} count={22} spread={90} size={40} seed={91} palette={["#7c9f69", "#8bb07a", "#6f9461"]} />
        <LeafCluster cx={398} cy={730} count={20} spread={80} size={38} seed={92} palette={["#7c9f69", "#8bb07a", "#a8c78d"]} />
      </g>
      <g filter="url(#blur2)">
        <Flower x={30} y={690} r={9} color="#f6d0d6" />
        <Flower x={366} y={672} r={8} color="#ffffff" />
        <Flower x={352} y={700} r={6} color="#e5d7f2" />
      </g>
    </g>
  );
}
