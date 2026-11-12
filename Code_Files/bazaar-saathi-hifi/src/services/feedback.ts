/**
 * Feedback is never carried by one channel (A2 §7): every state change comes with
 * a symbol + words on screen, a sound, and a vibration pattern. Trust states have
 * distinct tones and haptics so a user who cannot read still gets them (A1 §8.4).
 */
export type Cue = 'tap' | 'send' | 'error' | 'verified' | 'unchecked' | 'blocked' | 'reply';

const HAPTIC: Record<Cue, number | number[]> = {
  tap: 15,
  send: 40,
  error: [80, 60, 80],
  verified: 60,
  unchecked: [70, 70, 70],
  blocked: [250],
  reply: [30, 40, 30],
};
// [frequency Hz, duration ms] notes
const TONE: Record<Cue, [number, number][]> = {
  tap: [],
  send: [[880, 70]],
  error: [[220, 120], [0, 60], [220, 120]],
  verified: [[660, 260]],
  unchecked: [[520, 110], [0, 70], [520, 110]],
  blocked: [[330, 160], [220, 260]],
  reply: [[740, 80], [0, 40], [990, 90]],
};

let ctx: AudioContext | null = null;
export let soundOn = true;
export const setSound = (v: boolean) => (soundOn = v);

export function cue(kind: Cue) {
  try { if ('vibrate' in navigator) navigator.vibrate(HAPTIC[kind]); } catch { /* */ }
  if (!soundOn || !TONE[kind].length) return;
  try {
    ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
    let t = ctx.currentTime + 0.01;
    for (const [f, d] of TONE[kind]) {
      if (f > 0) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d / 1000);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + d / 1000 + 0.02);
      }
      t += d / 1000;
    }
  } catch { /* no audio */ }
}
