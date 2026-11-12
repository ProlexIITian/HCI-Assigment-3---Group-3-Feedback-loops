import type { Lang } from '../i18n';
import { ACT, REG_I, type Register } from '../data/acts';
import { driftRegister } from './register';
import type { Translation } from './translator';

/**
 * Compression simulator. Assignment 1 names the risk the verifier exists for:
 * a quantised model degrades SILENTLY (R33) — politeness leaks, a clause drops,
 * a number is rewritten. This module injects exactly those faults at rates that grow
 * as precision falls, so the verifier is exercised by real outputs, not by a flag.
 * The facilitator can also force one fault for the next sentence (Wizard of Oz).
 */
export type Precision = '16' | '8' | '4' | '3';
export type Fault = 'register' | 'meaning' | 'number' | 'lowconf';
export const FAULT_RATE: Record<Precision, number> = { '16': 0, '8': 0.04, '4': 0.12, '3': 0.25 };

export interface Degraded extends Translation { injected: Fault[] }

export function degrade(tr: Translation, lang: Lang, reg: Register, precision: Precision, forced: Fault | 'pass' | null, rnd: () => number = Math.random): Degraded {
  const faults: Fault[] = [];
  if (forced && forced !== 'pass') faults.push(forced);
  else if (!forced) {
    const p = FAULT_RATE[precision];
    (['register', 'meaning', 'number', 'lowconf'] as Fault[]).forEach((f) => rnd() < p && faults.push(f));
  }
  let text = tr.text;
  let clauses = tr.clauses.slice();
  let confidence = tr.confidence - (precision === '3' ? 0.08 : precision === '4' ? 0.03 : 0);
  for (const f of faults) {
    if (f === 'register') {
      // Lower the register by one step (or to familiar), as decoding leakage would.
      text = driftRegister(text, lang);
      if (text === tr.text) text = text.replace(/[.?।]?\s*$/, '!');
    }
    if (f === 'meaning') {
      if (clauses.length > 1) {
        const drop = clauses.find((c) => c.intent !== 'counter' && c.intent !== 'final' && c.intent !== 'number') ?? clauses[0];
        clauses = clauses.filter((c) => c !== drop);
        text = text.replace(drop.text, '').replace(/\s+/g, ' ').trim();
      } else {
        // a single clause turns into a different, fluent act
        const other = ACT['hello'].w[lang] ?? ACT['hello'].w.en!;
        const keep = text.match(/_NUM\d+_/g) ?? [];
        text = other[REG_I[reg]] + (keep.length ? ` ${keep.map((k) => `₹${k}`).join(' ')}` : '');
      }
    }
    if (f === 'number') {
      const m = text.match(/_NUM\d+_/);
      if (m) text = text.replace(m[0], String(14));
      else text = `${text} 14`;
    }
    if (f === 'lowconf') confidence = Math.min(confidence, 0.32);
  }
  return { ...tr, text, clauses, confidence: Math.max(0, Math.round(confidence * 100) / 100), injected: faults };
}
