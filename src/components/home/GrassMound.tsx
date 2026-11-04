import { Flower, mulberry32 } from "@/components/greenhouse/svg-kit";
import { grassIslandArt } from "@/lib/assets";

const rnd = mulberry32(5);
const BLADES = Array.from({ length: 90 }, () => {
  const a = rnd() * Math.PI * 2;
  const r = Math.sqrt(rnd());
  const x = 150 + Math.cos(a) * r * 132;
  const y = 46 + Math.sin(a) * r * 26;
  return { x: +x.toFixed(1), y: +y.toFixed(1), h: +(5 + rnd() * 7).toFixed(1), lean: +((rnd() - 0.5) * 5).toFixed(1), c: ["#8fb46f", "#a3c582", "#7aa262", "#b5d394"][Math.floor(rnd() * 4)] };
}).sort((a, b) => a.y - b.y);

/** Mossy grass island Selly sits on. Sized relative to Selly's box. */
export function GrassMound() {
  if (grassIslandArt) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={grassIslandArt}
        alt=""
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[90%] w-[170%] max-w-none -translate-x-1/2 -translate-y-1/2"
      />
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 90"
      className="pointer-events-none absolute left-1/2 top-[76%] w-[150%] -translate-x-1/2 overflow-visible"
    >
      <defs>
        <radialGradient id="moss" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#c7dc9f" />
          <stop offset="0.55" stopColor="#9fc07a" />
          <stop offset="1" stopColor="#7f9f5f" />
        </radialGradient>
        <radialGradient id="mossLight" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6cf" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff6cf" stopOpacity="0" />
        </radialGradient>
        <filter id="mossFuzz" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="9" />
          <feDisplacementMap in="SourceGraphic" scale="6" />
        </filter>
        <filter id="mossShadow" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <ellipse cx={150} cy={58} rx={146} ry={26} fill="#5f6f3e" opacity={0.35} filter="url(#mossShadow)" />
      <ellipse cx={150} cy={46} rx={140} ry={30} fill="url(#moss)" filter="url(#mossFuzz)" />
      <ellipse cx={150} cy={40} rx={90} ry={16} fill="url(#mossLight)" />
      {BLADES.map((b, i) => (
        <path key={i} d={`M${b.x} ${b.y} q ${b.lean / 2} ${-b.h / 2} ${b.lean} ${-b.h}`} stroke={b.c} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      ))}
      <Flower x={40} y={52} r={4} color="#f6d4dc" />
      <Flower x={262} y={50} r={4.5} color="#ffffff" />
      <Flower x={238} y={62} r={3.5} color="#e7daf3" />
      <Flower x={64} y={64} r={3} color="#ffffff" />
    </svg>
  );
}
