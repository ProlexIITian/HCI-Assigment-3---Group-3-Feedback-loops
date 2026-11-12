import type { Register } from '../data/acts';
import type { Lang } from '../i18n';
import { translateCloud, type CloudSettings } from './cloud';
import { degrade, type Fault, type Precision } from './compression';
import { parse, type Frame } from './parser';
import { glossOf, translateOffline } from './translator';
import { verify, type Verification } from './verifier';

/** Solution B, end to end: slot extraction → constrained translation → verifier. */
export interface BResult {
  source: string;
  frame: Frame;
  masked: string;
  output: string; // masked output
  verification: Verification;
  engine: 'offline' | 'cloud';
  injected: Fault[];
  back: string; // back-translation shown to the user, in her language
  ms: number;
  cloudError?: string;
}

export interface BOptions {
  src: Lang;
  tgt: Lang;
  reg: Register;
  engine: 'offline' | 'cloud';
  precision: Precision;
  forced: Fault | 'pass' | null;
  cloud: CloudSettings;
}

export async function runB(source: string, o: BOptions): Promise<BResult> {
  const t0 = performance.now();
  const frame = parse(source);
  let output: string;
  let confidence: number;
  let back: string | undefined;
  let engine: 'offline' | 'cloud' = 'offline';
  let cloudError: string | undefined;
  let injected: Fault[] = [];

  if (o.engine === 'cloud') {
    try {
      const c = await translateCloud(frame.masked, o.src, o.tgt, o.reg, o.cloud);
      output = c.text;
      confidence = c.confidence;
      back = c.back;
      engine = 'cloud';
      if (o.forced && o.forced !== 'pass') {
        const d = degrade({ text: output, clauses: [{ intent: '?', text: output }], confidence, engine }, o.tgt, o.reg, o.precision, o.forced);
        output = d.text; confidence = d.confidence; injected = d.injected;
      }
    } catch (e) {
      cloudError = String((e as Error).message ?? e);
    }
  }
  if (engine === 'offline') {
    const tr = translateOffline(frame, o.tgt, o.reg);
    const d = degrade(tr, o.tgt, o.reg, o.precision, o.forced);
    output = d.text; confidence = d.confidence; injected = d.injected;
  }
  const verification = verify({ src: frame, slots: frame.slots, out: output!, tgt: o.tgt, reg: o.reg, confidence: confidence!, back: back ? unmaskBack(back, frame) : undefined, ui: o.src });
  const shownBack = back ? unmaskBack(back, frame) : glossOf(parse(verification.spoken), o.src, []);
  return { source, frame, masked: frame.masked, output: output!, verification, engine, injected, back: shownBack, ms: Math.round(performance.now() - t0), cloudError };
}

function unmaskBack(back: string, f: Frame) {
  let s = back;
  for (const sl of f.slots) s = s.split(sl.id).join(String(sl.value));
  return s;
}
