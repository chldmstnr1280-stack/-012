/**
 * Calendar marker colours — validated with the dataviz palette checker
 * (lightness band, chroma, CVD and normal-vision separation all PASS).
 * Each also differs by shape: filled band / soft disc / ring / dashed ring.
 */
export const CYCLE_COLORS = {
  period: "#E3707E",
  periodFill: "#F7C9CF",
  periodBand: "#FBDDE1",
  fertile: "#8F7FD6",
  fertileFill: "rgba(143,127,214,0.16)",
  ovulation: "#4F9154",
  today: "#7ea47a",
} as const;
