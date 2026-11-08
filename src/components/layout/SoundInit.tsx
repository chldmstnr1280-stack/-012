"use client";

import { useEffect, useState } from "react";
import { useAppData } from "@/lib/data-store";
import { useSelly } from "@/lib/selly-store";
import { getEngine, onDuck, resume, setBusVolume, suspend, unlock } from "@/lib/sound/engine";
import { activeNatureLayers, setNatureDuck, setNatureScene, setNatureVolume } from "@/lib/sound/nature";
import { useAmbience } from "@/lib/game/ambience";
import { natureOn, natureVolume, useGardenWeather } from "@/lib/garden/weather";
import { setMusicCalm, setMusicVolume, startMusic, stopMusic } from "@/lib/sound/music";
import { playSfx, setSfxEnabled } from "@/lib/sound/sfx";

/**
 * Wires the sound engine to the user's preferences.
 * Audio starts on the first tap anywhere (browser autoplay rules),
 * pauses when the app goes to the background, and the music turns calm while breathing.
 */
export function SoundInit() {
  const { prefs } = useAppData();
  const { immersive } = useSelly();
  const [unlocked, setUnlocked] = useState(false);
  const { weather } = useGardenWeather();
  const tod = useAmbience();

  // Turn sound on with a gesture the browser accepts (end of a touch, a click, a key),
  // and keep trying on every gesture while it is not running — this also brings the
  // sound back after iOS suspends it (another app, a call, the screen locking).
  useEffect(() => {
    const events = ["pointerup", "touchend", "click", "keydown"] as const;
    const go = async () => {
      if (getEngine()?.ctx.state === "running" && unlocked) return;
      if (await unlock()) setUnlocked(true);
    };
    events.forEach((ev) => window.addEventListener(ev, go, { capture: true, passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, go, { capture: true }));
  }, [unlocked]);

  useEffect(() => {
    setSfxEnabled(prefs.sfx);
    if (!unlocked) return;
    // synth voices are quiet by design; these gains bring them to a clear level on phone speakers
    setBusVolume("sfx", prefs.sfx ? prefs.sfxVolume * 2.2 : 0, 0.1);
    setBusVolume("cue", 1.6, 0.1);
  }, [unlocked, prefs.sfx, prefs.sfxVolume]);

  useEffect(() => {
    setMusicVolume(prefs.musicVolume);
    if (!unlocked) return;
    if (prefs.music && prefs.musicVolume > 0) startMusic();
    else stopMusic();
  }, [unlocked, prefs.music, prefs.musicVolume]);

  useEffect(() => {
    setMusicCalm(immersive);
  }, [immersive]);

  // nature sounds follow the greenhouse weather and time — only after the first tap
  const natureWanted = natureOn(prefs);
  const natureLevel = natureVolume(prefs);
  useEffect(() => {
    setNatureVolume(natureLevel);
  }, [natureLevel]);
  useEffect(() => {
    if (!unlocked) return;
    setNatureScene(natureWanted && natureLevel > 0 ? { weather, tod } : null);
  }, [unlocked, natureWanted, natureLevel, weather, tod]);
  useEffect(() => onDuck((level) => setNatureDuck(level)), []);

  useEffect(() => {
    const onVis = () => {
      if (!getEngine()) return;
      if (document.hidden) suspend();
      else resume();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(
    () => () => {
      stopMusic();
      setNatureScene(null);
    },
    [],
  );

  // development-only hook used by the audio render checks
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __sound?: object }).__sound = { playSfx, startMusic, stopMusic, unlock, activeNatureLayers };
  }, []);
  return null;
}
