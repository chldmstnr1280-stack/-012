"use client";

/**
 * Approximate step detection from the phone's motion sensor (while the page is open).
 * This is an estimate for a gentle walk companion, not a pedometer.
 *
 * Gravity is tracked with a low-pass filter; the remaining "bounce" is smoothed
 * and every peak above a small threshold, at a human cadence, counts as a step.
 */
export type MotionAccess = "granted" | "denied" | "unsupported";

/** Must be called from a user gesture (iOS asks for permission). */
export async function requestMotionAccess(): Promise<MotionAccess> {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return "unsupported";
  const DME = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
  if (typeof DME.requestPermission === "function") {
    try {
      // iOS answers granted/denied; newer Chromium may answer "prompt" while still delivering events —
      // only a clear "denied" stops us; otherwise we listen and fall back if no data arrives
      return (await DME.requestPermission()) === "denied" ? "denied" : "granted";
    } catch {
      return "denied";
    }
  }
  return "granted";
}

export interface StepDetector {
  stop: () => void;
}

export function startStepDetector(onStep: (cadenceHz: number) => void, onFirstSample?: () => void): StepDetector {
  let gravity = 9.81;
  let smooth = 0;
  let prev = 0;
  let rising = false;
  let lastStep = 0;
  let sampled = false;

  const handler = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null || a.z == null) return;
    if (!sampled) {
      sampled = true;
      onFirstSample?.();
    }
    const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    gravity = gravity * 0.95 + mag * 0.05;
    smooth = smooth * 0.7 + (mag - gravity) * 0.3;
    const now = performance.now();
    if (smooth > prev) rising = true;
    else if (rising && prev > 1.1) {
      // a peak
      rising = false;
      const dt = now - lastStep;
      if (dt > 280 && dt < 2000) onStep(1000 / dt);
      else if (dt >= 2000) onStep(1.6); // first step after a pause
      lastStep = now;
    } else if (smooth < prev) rising = false;
    prev = smooth;
  };
  window.addEventListener("devicemotion", handler);
  return { stop: () => window.removeEventListener("devicemotion", handler) };
}
