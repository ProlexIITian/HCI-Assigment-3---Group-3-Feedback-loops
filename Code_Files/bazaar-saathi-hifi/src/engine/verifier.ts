import { ACT, type Register } from '../data/acts';
import type { Lang } from '../i18n';
import { fmtSlot, unmask, type NumSlot } from './numbers';
import { parse, type Frame } from './parser';
import { classifyRegister } from './register';

/**
 * The four-check verifier (Assignment 1 §8.2.4, Table 15) and the three-light trust
 * contract (§8.3, Table 16). Runs entirely on the phone for both engines.
 *   Verified  : all four checks pass                → one tap speaks
 *   Unchecked : register or round-trip fails,
 *               numbers intact                        → needs a deliberate second tap
 *   Blocked   : number check fails or low confidence → will not speak
 */
export type CheckId = 'numbers' | 'register' | 'round' | 'conf';
export interface Check { id: CheckId; pass: boolean; detail: string }
export type Trust = 'verified' | 'unchecked' | 'blocked';
export interface Verification {
  state: Trust;
  checks: Check[];
  reason: { key: 'rRegister' | 'rRound' | 'rNumbers' | 'rConf' | 'rNothing'; vars?: Record<string, string> } | null;
  spoken: string; // final sentence with numbers substituted
  gotRegister: Register;
  lost: string[];
}

export const CONF_THRESHOLD = 0.55;
const RANK: Record<Register, number> = { familiar: 0, neutral: 1, respectful: 2 };

export function verify(args: {
  src: Frame;
  slots: NumSlot[];
  out: string; // masked output (placeholders)
  tgt: Lang;
  reg: Register;
  confidence: number;
  /** Back-translation text (cloud engine). Offline engine re-reads the output itself. */
  back?: string;
  ui: Lang;
}): Verification {
  const { src, slots, out, tgt, reg, confidence } = args;
  const spoken = unmask(out, slots);

  // 1. Number integrity: every placeholder exactly once, and no stray number appears.
  const missing = slots.filter((s) => out.split(s.id).length - 1 !== 1);
  const stray = out.replace(/_NUM\d+_/g, '').match(/\d+/g) ?? [];
  const numOk = missing.length === 0 && stray.length === 0;
  const numDetail = slots.length
    ? slots.map((s) => `${fmtSlot(s)} ${missing.includes(s) ? '✕' : '✓'}`).join(' · ') + (stray.length ? ` · stray ${stray.join(',')}` : '')
    : stray.length ? `stray ${stray.join(',')}` : 'no numbers';

  // 2. Register: output must be at least as polite as the switch.
  const rr = classifyRegister(spoken, tgt);
  const regOk = RANK[rr.level] >= RANK[reg];

  // 3. Round-trip: the acts (and numbers) the user meant must survive back-translation.
  const back = parse(args.back ?? spoken);
  const want = src.intents.filter((h) => h.score >= 1).map((h) => h.id);
  const got = new Set(back.intents.map((h) => h.id));
  const equivalent: Record<string, string[]> = { counter: ['final', 'qtykg'], final: ['counter'], qtykg: ['counter', 'final'], tooexp: ['final'] };
  const lost = want.filter((id) => !got.has(id) && !(equivalent[id] ?? []).some((e) => got.has(e)));
  const backVals = back.slots.map((s) => s.value);
  const numsSurvive = slots.every((s) => backVals.includes(s.value));
  const roundOk = lost.length === 0 && (numOk ? numsSurvive : true);

  // 4. Confidence against the threshold.
  const confOk = confidence >= CONF_THRESHOLD;

  const checks: Check[] = [
    { id: 'numbers', pass: numOk, detail: numDetail },
    { id: 'register', pass: regOk, detail: `${rr.level}${rr.markers.length ? ` (${rr.markers.slice(0, 3).join(' ')})` : ''}` },
    { id: 'round', pass: roundOk, detail: lost.length ? `lost: ${lost.map((l) => ACT[l]?.label[args.ui] ?? l).join(', ')}` : 'meaning kept' },
    { id: 'conf', pass: confOk, detail: `${Math.round(confidence * 100)}% (needs ${Math.round(CONF_THRESHOLD * 100)}%)` },
  ];

  const nothing = !src.slots.length && !want.length;
  let state: Trust = 'verified';
  let reason: Verification['reason'] = null;
  if (nothing) { state = 'blocked'; reason = { key: 'rNothing' }; }
  else if (!numOk) { state = 'blocked'; reason = { key: 'rNumbers' }; }
  else if (!confOk) { state = 'blocked'; reason = { key: 'rConf' }; }
  else if (!regOk) { state = 'unchecked'; reason = { key: 'rRegister', vars: { got: rr.level, want: reg } }; }
  else if (!roundOk) { state = 'unchecked'; reason = { key: 'rRound', vars: { lost: lost.map((l) => ACT[l]?.label[args.ui] ?? l).join(', ') } }; }
  return { state, checks, reason, spoken, gotRegister: rr.level, lost };
}
