import { ACT } from '../data/acts';
import { INTENT_KEYS, ITEMS, SELLER_KEYS, STOP } from './lexicon';
import { clean, extractNumbers, isKgWord, isRsWord, type NumSlot } from './numbers';

export interface IntentHit { id: string; score: number; hits: string[] }
export interface Frame {
  text: string;
  masked: string;
  slots: NumSlot[];
  intents: IntentHit[]; // sorted, strongest first
  items: string[];
  coverage: number; // share of tokens the recogniser understood (0–1)
  tokenCount: number;
  unknown: string[];
}

const isLatin = (s: string) => /^[\x00-\x7F₹]+$/.test(s);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function has(textLower: string, key: string): boolean {
  if (isLatin(key)) return new RegExp(`(^|[^a-z])${esc(key)}([^a-z]|$)`).test(textLower);
  return textLower.includes(key);
}

const PIECES = (() => {
  const s = new Set<string>();
  const addAll = (arr: string[]) => arr.forEach((k) => k.split(/\s+/).forEach((p) => p.length >= 2 && s.add(p.toLowerCase())));
  Object.values(INTENT_KEYS).forEach(addAll);
  Object.values(SELLER_KEYS).forEach(addAll);
  Object.values(ITEMS).forEach((i) => addAll(i.keys));
  return [...s];
})();

function tokenKnown(tok: string): boolean {
  const w = clean(tok).toLowerCase();
  if (!w) return true;
  if (STOP.has(w) || /^_NUM\d+_$/.test(w) || /^\d+$/.test(w) || isKgWord(w) || isRsWord(w)) return true;
  return PIECES.some((p) => (isLatin(p) ? w === p || (p.length > 3 && w.startsWith(p)) : w.includes(p)));
}

export function parse(text: string, keys: Record<string, string[]> = INTENT_KEYS): Frame {
  const ex = extractNumbers(text);
  const lower = ex.masked.toLowerCase();
  const scores = new Map<string, IntentHit>();
  for (const [id, ks] of Object.entries(keys)) {
    for (const k of ks) {
      if (has(lower, k.toLowerCase())) {
        const hit = scores.get(id) ?? { id, score: 0, hits: [] };
        hit.score += k.includes(' ') ? 2 : 1;
        hit.hits.push(k);
        scores.set(id, hit);
      }
    }
  }
  const price = ex.slots.find((s) => s.unit === 'rupees');
  const weight = ex.slots.find((s) => s.unit === 'kg');
  const bump = (id: string, by: number) => {
    const h = scores.get(id) ?? { id, score: 0, hits: [] };
    h.score += by;
    scores.set(id, h);
  };
  // Context rules: a price with no question is an offer; "final" outranks a plain counter.
  if (price) {
    scores.delete('howmuch');
    if (scores.has('final')) { bump('final', 2); scores.delete('counter'); }
    else bump('counter', 1.5);
    if (weight) scores.delete('qtykg');
  } else {
    // offer words without a price stay weak; they cannot become a counter-offer on their own
    const c = scores.get('counter');
    if (c) c.score = Math.min(c.score, 0.5);
    if (weight) bump('qtykg', 2);
    else scores.delete('qtykg');
  }
  if (scores.has('half')) scores.delete('qtykg');
  if (scores.has('refuse')) scores.delete('qtykg');

  const intents = [...scores.values()].filter((h) => h.score > 0 && (ACT[h.id] || keys !== INTENT_KEYS)).sort((a, b) => b.score - a.score);
  const items = Object.entries(ITEMS).filter(([, v]) => v.keys.some((k) => has(lower, k.toLowerCase()))).map(([id]) => id);

  const toks = ex.masked.split(/\s+/).filter((t) => clean(t));
  const unknown = toks.filter((t) => !tokenKnown(t));
  const coverage = toks.length ? (toks.length - unknown.length) / toks.length : 0;
  return { text, masked: ex.masked, slots: ex.slots, intents, items, coverage, tokenCount: toks.length, unknown };
}

// ─── Solution A: map a frame to ONE act (classification, not transcription) ───
export interface ActGuess {
  kind: 'sure' | 'unsure' | 'numberMissing' | 'nothing';
  actId?: string;
  value: number | null;
  candidates: { actId: string; value: number | null }[];
  confidence: number;
}

export function classifyAct(f: Frame): ActGuess {
  const top = f.intents[0];
  const priceOrWeight = (actId: string) => {
    const u = ACT[actId]?.unit;
    const s = f.slots.find((x) => x.unit === u) ?? (u ? undefined : f.slots[0]);
    return s ? s.value : null;
  };
  const candidates = f.intents.slice(0, 3).map((h) => ({ actId: h.id, value: ACT[h.id]?.needsNumber ? priceOrWeight(h.id) : null }));
  if (!top) {
    return { kind: 'nothing', value: null, candidates: [{ actId: 'counter', value: null }, { actId: 'howmuch', value: null }, { actId: 'tooexp', value: null }], confidence: 0 };
  }
  const second = f.intents[1]?.score ?? 0;
  const margin = top.score / (top.score + second);
  const confidence = Math.round(margin * (0.4 + 0.6 * f.coverage) * 100) / 100;
  const value = ACT[top.id]?.needsNumber ? priceOrWeight(top.id) : null;
  if (ACT[top.id]?.needsNumber && value == null && margin > 0.6) return { kind: 'numberMissing', actId: top.id, value: null, candidates, confidence };
  if (margin < 0.6 || f.coverage < 0.45) {
    while (candidates.length < 3) {
      const fill = ['counter', 'howmuch', 'tooexp'].find((a) => !candidates.some((c) => c.actId === a))!;
      candidates.push({ actId: fill, value: null });
    }
    return { kind: 'unsure', value: null, candidates, confidence };
  }
  return { kind: 'sure', actId: top.id, value, candidates, confidence };
}

// ─── Seller side: what did the seller say? ───
export interface SellerReading { kind: 'quote' | 'agree' | 'refuse' | 'unclear'; value: number | null; long: boolean; frame: Frame }
export function readSeller(text: string): SellerReading {
  const f = parse(text);
  const sk = parse(text, SELLER_KEYS);
  const price = f.slots.find((s) => s.unit === 'rupees') ?? f.slots[0];
  const long = f.tokenCount > 8;
  if (price) return { kind: 'quote', value: price.value, long, frame: f };
  if (sk.intents.some((i) => i.id === 'refuse')) return { kind: 'refuse', value: null, long, frame: f };
  if (sk.intents.some((i) => i.id === 'accept') && !long) return { kind: 'agree', value: null, long, frame: f };
  return { kind: 'unclear', value: null, long, frame: f };
}
