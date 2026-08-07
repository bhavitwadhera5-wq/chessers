/** Tiny WebAudio blips so moves feel physical — no audio files needed. */
export type SoundName = "move" | "capture" | "check" | "end" | "wrong";

const SOUND_KEY = "clickchess.sound";

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const TONES: Record<SoundName, { freq: number; to: number; dur: number; type: OscillatorType }> = {
  move: { freq: 320, to: 240, dur: 0.08, type: "triangle" },
  capture: { freq: 180, to: 90, dur: 0.13, type: "square" },
  check: { freq: 660, to: 880, dur: 0.14, type: "triangle" },
  end: { freq: 520, to: 180, dur: 0.4, type: "sine" },
  wrong: { freq: 200, to: 120, dur: 0.2, type: "sawtooth" },
};

export function soundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "off";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

export function playSound(name: SoundName) {
  if (!soundEnabled()) return;
  const audio = context();
  if (!audio) return;
  const t = TONES[name];
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = t.type;
  osc.frequency.setValueAtTime(t.freq, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(t.to, audio.currentTime + t.dur);
  gain.gain.setValueAtTime(0.09, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t.dur);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + t.dur + 0.02);
}

/** Picks the right cue for a move that was just played. */
export function playMoveSound(opts: { captured?: boolean; check?: boolean; over?: boolean }) {
  if (opts.over) return playSound("end");
  if (opts.check) return playSound("check");
  return playSound(opts.captured ? "capture" : "move");
}

