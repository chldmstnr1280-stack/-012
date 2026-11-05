/**
 * Symptom intensity colours (score 1–4, increasing warmth) shared by the
 * record form, report and calendar. Recorded-with-none uses sage; a day with
 * no entry is drawn as an empty dashed cell, never as 0.
 */
export const INTENSITY_FILL = ["#cfdccb", "#f6e3b4", "#f3c79a", "#e9a092", "#c9707a"] as const;
export const INTENSITY_INK = ["#4f6f4d", "#7a5a14", "#7a3f12", "#ffffff", "#ffffff"] as const;
export const INTENSITY_EDGE = ["#a9c2a4", "#d9b85e", "#d99a5c", "#cf7b6c", "#a9505b"] as const;
export const MISSING_EDGE = "#d9cfc2";
export const PMS_WINDOW = "rgba(224,164,88,0.2)";
export const PMS_WINDOW_EDGE = "#c98a3a";
