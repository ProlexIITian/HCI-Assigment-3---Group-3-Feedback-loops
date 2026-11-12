import { BCP47, type Lang } from '../i18n';
import type { Register } from '../data/acts';

/**
 * Speech in and out, using the phone's own engines (Web Speech API).
 * TTS stands in for the fine-tuned per-register voice: register conditions the
 * prosody (respectful = slower and flatter, familiar = quicker and livelier, A1 §7.4).
 * ASR asks the browser for on-device recognition first (Chrome `processLocally`);
 * when only the cloud recogniser exists the app says so (see Settings).
 */
export const PROSODY: Record<Register, { rate: number; pitch: number }> = {
  respectful: { rate: 0.86, pitch: 0.95 },
  neutral: { rate: 1, pitch: 1 },
  familiar: { rate: 1.1, pitch: 1.15 },
};

let voices: SpeechSynthesisVoice[] = [];
function loadVoices() {
  try { voices = window.speechSynthesis?.getVoices() ?? []; } catch { voices = []; }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function voiceFor(lang: Lang): SpeechSynthesisVoice | undefined {
  const tag = BCP47[lang].toLowerCase();
  const pre = tag.slice(0, 2);
  return voices.find((v) => v.lang.toLowerCase().replace('_', '-') === tag) ?? voices.find((v) => v.lang.toLowerCase().startsWith(pre));
}
export const hasVoice = (lang: Lang) => !!voiceFor(lang);
export const ttsSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, lang: Lang, reg: Register = 'neutral', speed = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported()) return resolve();
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/₹\s?/g, lang === 'en' ? 'rupees ' : '₹'));
      u.lang = BCP47[lang];
      const v = voiceFor(lang);
      if (v) u.voice = v;
      u.rate = PROSODY[reg].rate * speed;
      u.pitch = PROSODY[reg].pitch;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
      setTimeout(resolve, 12000);
    } catch {
      resolve();
    }
  });
}
export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
}

// ── Recognition ──
type Rec = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const Ctor = (): (new () => Rec) | null => (typeof window === 'undefined' ? null : (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null);
export const asrSupported = () => !!Ctor();

export interface Listener { stop: () => void; abort: () => void }
export interface ListenOpts {
  lang: Lang;
  preferOnDevice: boolean;
  onText: (text: string, final: boolean) => void;
  onEnd: (finalText: string) => void;
  onError: (err: string) => void;
  onMode?: (mode: 'on-device' | 'cloud') => void;
}

export function listen(o: ListenOpts): Listener | null {
  const C = Ctor();
  if (!C) return null;
  const r: Rec = new C();
  r.lang = BCP47[o.lang];
  r.interimResults = true;
  r.continuous = true;
  r.maxAlternatives = 1;
  let mode: 'on-device' | 'cloud' = 'cloud';
  if (o.preferOnDevice && 'processLocally' in r) {
    try { r.processLocally = true; mode = 'on-device'; } catch { /* not allowed */ }
  }
  o.onMode?.(mode);
  let finalText = '';
  let interim = '';
  let ended = false;
  r.onresult = (e: any) => {
    interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const tx = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += (finalText ? ' ' : '') + tx.trim();
      else interim += tx;
    }
    o.onText((finalText + ' ' + interim).trim(), false);
  };
  r.onerror = (e: any) => {
    if (e.error === 'language-not-supported' && mode === 'on-device') {
      // fall back once to the browser's cloud recogniser
      ended = true;
      const again = listen({ ...o, preferOnDevice: false });
      if (!again) o.onError('language-not-supported');
      handle.stop = again ? again.stop : () => {};
      handle.abort = again ? again.abort : () => {};
      return;
    }
    if (e.error !== 'no-speech' && e.error !== 'aborted') o.onError(e.error);
  };
  r.onend = () => {
    if (ended) return;
    ended = true;
    o.onEnd((finalText + ' ' + interim).trim());
  };
  const handle: Listener = { stop: () => { try { r.stop(); } catch { /* */ } }, abort: () => { ended = true; try { r.abort(); } catch { /* */ } } };
  try { r.start(); } catch (e) { o.onError(String(e)); return null; }
  return handle;
}
