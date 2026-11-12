import { ACT, REG_I, type Register } from '../data/acts';
import type { Lang } from '../i18n';
import { parse, type Frame } from './parser';
import type { NumSlot } from './numbers';

/**
 * Solution B translator, offline stand-in (Assignment 1 §8.2.3).
 * The real design is a distilled, quantised NMT model with a forced register token.
 * This prototype uses a domain-restricted generator with the SAME contract:
 *   input  = masked source (numbers already replaced by _NUMk_) + register token
 *   output = target sentence that must carry every placeholder exactly once
 * It composes native-authored clauses for each market act it recognises, so it is
 * honest about its range: anything outside the market domain lowers confidence and
 * is caught by the verifier rather than translated into fluent nonsense.
 */

const ORDER = ['hello', 'thanks', 'findveg', 'findwater', 'haveit', 'othertype', 'fresh', 'old', 'another', 'taste', 'howmuch', 'tooexp', 'counter', 'final', 'qtykg', 'half', 'little', 'pack', 'upi', 'cash', 'change', 'deliver', 'when', 'weightshort', 'wrongitem', 'slow', 'again', 'shownum', 'accept', 'refuse', 'bye'];

/** Offer with both a price and a weight: "40 for 2 kg" (placeholders {p} and {q}). */
const OFFER_QTY: Record<Lang, [string, string, string]> = {
  hi: ['भाई साहब, {q} किलो के लिए ₹{p} ठीक रहेंगे, दे दीजिए?', 'भैया, {q} किलो ₹{p} में दे दो।', 'अरे भैया, {q} किलो ₹{p} में दे दो!'],
  mr: ['दादा, {q} किलोसाठी ₹{p} चालतील का? द्याल का?', 'दादा, {q} किलो ₹{p} ला द्या.', 'अरे दादा, {q} किलो ₹{p} ला लावा!'],
  gu: ['ભાઈ, {q} કિલોના ₹{p} ચાલશે? આપશો?', 'ભાઈ, {q} કિલો ₹{p}માં આપો.', 'અરે ભાઈ, {q} કિલો ₹{p}માં લગાવો!'],
  bn: ['দাদা, {q} কেজি ₹{p}-এ দেবেন কি?', 'দাদা, {q} কেজি ₹{p}-এ দিন।', 'আরে দাদা, {q} কেজি ₹{p}-এ দাও!'],
  en: ['Sir, would ₹{p} for {q} kg be all right?', '₹{p} for {q} kg.', 'Hey, make it ₹{p} for {q} kg!'],
};

export interface Clause { intent: string; text: string }
export interface Translation { text: string; clauses: Clause[]; confidence: number; engine: 'offline' | 'cloud'; back?: string }

const stripAddress = (s: string) => {
  const i = s.search(/[,،]\s/);
  return i > 0 && i < 22 ? s.slice(i + 2) : s;
};

export function translateOffline(src: Frame, tgt: Lang, reg: Register): Translation {
  const price = src.slots.find((s) => s.unit === 'rupees');
  const weight = src.slots.find((s) => s.unit === 'kg');
  const ids = new Set(src.intents.filter((h) => h.score >= 1).map((h) => h.id));
  if (ids.has('accept') && ids.has('refuse')) ids.delete(src.intents.findIndex((h) => h.id === 'accept') < src.intents.findIndex((h) => h.id === 'refuse') ? 'refuse' : 'accept');
  if (ids.has('final')) ids.delete('counter');
  if ((ids.has('counter') || ids.has('final')) && weight) ids.delete('qtykg');

  const clauses: Clause[] = [];
  for (const id of ORDER) {
    if (!ids.has(id)) continue;
    const act = ACT[id];
    if (!act) continue;
    let text: string;
    if (id === 'counter' && price && weight) {
      text = OFFER_QTY[tgt][REG_I[reg]].replace('{p}', price.id).replace('{q}', weight.id);
    } else {
      const w = act.w[tgt] ?? act.w.en!;
      const slot = act.unit === 'kg' ? weight : act.unit === 'rupees' ? price : undefined;
      if (act.needsNumber && !slot) continue; // never invent a number
      text = w[REG_I[reg]].split('{n}').join(slot ? slot.id : '');
      if (id === 'final' && weight) text += ` (${weight.id} kg)`;
    }
    clauses.push({ intent: id, text: clauses.length ? stripAddress(text) : text });
  }
  // A bare number with no act: send it as a price/weight statement.
  if (!clauses.length && src.slots.length) {
    const s = price ?? weight!;
    clauses.push({ intent: 'number', text: s.unit === 'rupees' ? `₹${s.id}` : `${s.id} kg` });
  }
  const text = clauses.map((c) => c.text).join(' ');
  let confidence = clauses.length ? 0.3 + 0.7 * src.coverage : 0.15;
  if (src.unknown.length > 4) confidence -= 0.1;
  return { text, clauses, confidence: Math.max(0, Math.min(1, Math.round(confidence * 100) / 100)), engine: 'offline' };
}

/** Back-translation used by the round-trip check: re-read the output with the recogniser. */
export function backFrameOf(outputUnmasked: string): Frame {
  return parse(outputUnmasked);
}

/** Meaning summary of a frame in the user's own language (shown under "Back-translation"). */
export function glossOf(f: Frame, ui: Lang, slots: NumSlot[]): string {
  const g = translateOffline({ ...f, slots: slots.length ? slots : f.slots }, ui, 'neutral');
  let s = g.text;
  for (const sl of slots.length ? slots : f.slots) s = s.split(sl.id).join(String(sl.value));
  return s;
}
