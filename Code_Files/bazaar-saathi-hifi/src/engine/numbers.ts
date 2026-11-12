/**
 * Slot extraction (Assignment 1 §7.5 / §8.2.2): prices and weights are lifted out of
 * the utterance BEFORE anything is translated, replaced with typed placeholders
 * (_NUM1_, _NUM2_ …), and shown as large digits. The translator never writes a number.
 */
export type Unit = 'rupees' | 'kg';
export interface NumSlot { id: string; value: number; unit: Unit; raw: string }

const DIGIT_BLOCKS = [0x0966 /* Devanagari */, 0x0ae6 /* Gujarati */, 0x09e6 /* Bengali */];
export function asciiDigits(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    const b = DIGIT_BLOCKS.find((z) => c >= z && c <= z + 9);
    out += b != null ? String(c - b) : ch;
  }
  return out;
}

/** Number words. Ambiguous words (Hindi "दो" also means "give", "एक" means "a") need an adjacent unit. */
const W: Record<string, number> = {};
const add = (v: number, ...ws: string[]) => ws.forEach((w) => (W[w] = v));
// Hindi (+ romanised)
add(2, 'two', 'दोन', 'બે', 'দুই');
add(3, 'तीन', 'teen', 'three', 'ત્રણ', 'তিন');
add(4, 'चार', 'char', 'four', 'ચાર', 'চার');
add(5, 'पाँच', 'पांच', 'पाच', 'paanch', 'five', 'પાંચ', 'পাঁচ');
add(6, 'छह', 'छः', 'सहा', 'six', 'છ', 'ছয়');
add(7, 'सात', 'seven', 'સાત', 'সাত');
add(8, 'आठ', 'eight', 'આઠ', 'আট');
add(9, 'नौ', 'नऊ', 'nine', 'નવ');
add(10, 'दस', 'दहा', 'das', 'ten', 'દસ', 'দশ');
add(12, 'बारह', 'बारा', 'twelve', 'બાર', 'বারো');
add(15, 'पंद्रह', 'पंधरा', 'fifteen', 'પંદર', 'পনেরো');
add(20, 'बीस', 'वीस', 'bees', 'twenty', 'વીસ', 'কুড়ি', 'বিশ');
add(25, 'पच्चीस', 'पंचवीस', 'pachchis', 'twenty-five', 'પચ્ચીસ', 'পঁচিশ');
add(30, 'तीस', 'tees', 'thirty', 'ત્રીસ', 'ত্রিশ');
add(35, 'पैंतीस', 'पस्तीस', 'thirty-five', 'પાંત્રીસ', 'পঁয়ত্রিশ');
add(40, 'चालीस', 'चाळीस', 'chalis', 'chaalis', 'forty', 'ચાલીસ', 'ચાળીસ', 'চল্লিশ');
add(45, 'पैंतालीस', 'पंचेचाळीस', 'paintalis', 'forty-five', 'પિસ્તાલીસ', 'পঁয়তাল্লিশ');
add(50, 'पचास', 'पन्नास', 'pachas', 'pachaas', 'fifty', 'પચાસ', 'পঞ্চাশ');
add(55, 'पचपन', 'पंचावन्न', 'fifty-five', 'પંચાવન', 'পঞ্চান্ন');
add(60, 'साठ', 'saath', 'sixty', 'સાઠ', 'ষাট');
add(65, 'पैंसठ', 'पासष्ट', 'sixty-five', 'પાંસઠ', 'পঁয়ষট্টি');
add(70, 'सत्तर', 'sattar', 'seventy', 'સિત્તેર', 'সত্তর');
add(75, 'पचहत्तर', 'पंच्याहत्तर', 'seventy-five', 'પંચોતેર', 'পঁচাত্তর');
add(80, 'अस्सी', 'ऐंशी', 'assi', 'eighty', 'એંસી', 'আশি');
add(90, 'नब्बे', 'नव्वद', 'nabbe', 'ninety', 'નેવું', 'নব্বই');
add(100, 'सौ', 'शंभर', 'sau', 'hundred', 'સો', 'একশো', 'শো');
const AMBIGUOUS: Record<string, number> = { 'दो': 2, do: 2, 'एक': 1, one: 1, 'এক': 1, 'দু': 2, 'নয়': 9 };
const HUNDRED = new Set(['सौ', 'शंभर', 'sau', 'hundred', 'સો', 'শো']);

const KG = ['किलो', 'kilo', 'kg', 'kgs', 'किग्रा', 'કિલો', 'কেজি', 'kilos'];
const RS = ['रुपये', 'रुपए', 'रुपया', 'रुपयां', 'रुपयात', 'रुपयाला', 'रुपयाचे', 'रु.', 'rupees', 'rupee', 'rupaye', 'rupay', 'rs', 'rs.', 'inr', '₹', 'રૂપિયા', 'રૂપિયે', 'રૂ.', 'টাকা', 'taka'];

export const isKgWord = (t: string) => KG.some((k) => t.toLowerCase().includes(k));
export const isRsWord = (t: string) => RS.some((k) => t.toLowerCase().includes(k));

const PUNCT = /^[\s,.!?;:।॥"'“”‘’()\-–—]+|[\s,.!?;:।॥"'“”‘’()\-–—]+$/g;
export const clean = (t: string) => t.replace(PUNCT, '');

export interface Extraction { slots: NumSlot[]; masked: string; tokens: string[]; numberTokenIdx: Set<number>; unitTokenIdx: Set<number> }

export function extractNumbers(input: string): Extraction {
  // 1. Normalise digits and split "40rs" / "2kg" / "₹40".
  const norm = asciiDigits(input)
    .replace(/₹\s*/g, '₹ ')
    .replace(/(\d)([^\d\s.,])/g, '$1 $2')
    .replace(/([^\d\s.,₹])(\d)/g, '$1 $2');
  const tokens = norm.split(/\s+/).filter(Boolean);
  const found: { i: number; j: number; value: number; unit: Unit | null }[] = [];
  const unitIdx = new Set<number>();

  for (let i = 0; i < tokens.length; i++) {
    const w = clean(tokens[i]).toLowerCase();
    let v: number | null = null;
    let span = 1;
    if (/^\d+(\.\d+)?$/.test(w)) v = Number(w);
    else if (W[w] != null) v = W[w];
    else if (AMBIGUOUS[w] != null) {
      const nx = clean(tokens[i + 1] ?? '');
      if (isKgWord(nx) || isRsWord(nx) || HUNDRED.has(nx)) v = AMBIGUOUS[w];
    }
    if (v == null) continue;
    // "forty five" / "दो सौ"
    const nx = clean(tokens[i + 1] ?? '').toLowerCase();
    if (v >= 20 && v % 10 === 0 && W[nx] != null && W[nx] < 10) { v += W[nx]; span = 2; }
    else if (HUNDRED.has(nx) && v < 10) { v *= 100; span = 2; }
    // unit: inside the token, or one of the next two tokens, or ₹ just before
    let unit: Unit | null = null;
    const prev = clean(tokens[i - 1] ?? '');
    const look = [tokens[i], tokens[i + span], tokens[i + span + 1]].map((x) => clean(x ?? ''));
    for (let k = 0; k < look.length; k++) {
      if (k === 2 && unit) break;
      if (isKgWord(look[k])) { unit = 'kg'; if (k > 0) unitIdx.add(i + span + k - 1); break; }
      if (isRsWord(look[k])) { unit = 'rupees'; if (k > 0) unitIdx.add(i + span + k - 1); break; }
    }
    if (!unit && (prev === '₹' || tokens[i - 1]?.endsWith('₹'))) { unit = 'rupees'; unitIdx.add(i - 1); }
    found.push({ i, j: i + span, value: v, unit });
    i += span - 1;
  }

  // 2. Fill in missing units: small number beside a price is a weight.
  const hasRs = found.some((f) => f.unit === 'rupees');
  for (const f of found) {
    if (f.unit) continue;
    const bigger = found.some((g) => g !== f && g.value > f.value);
    f.unit = (hasRs && f.value <= 20) || (bigger && f.value <= 10) ? 'kg' : 'rupees';
  }

  // 3. Mask.
  const slots: NumSlot[] = found.map((f, k) => ({ id: `_NUM${k + 1}_`, value: f.value, unit: f.unit!, raw: tokens.slice(f.i, f.j).join(' ') }));
  const numberTokenIdx = new Set<number>();
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const k = found.findIndex((f) => f.i === i);
    if (k >= 0) {
      out.push(slots[k].id);
      for (let x = found[k].i; x < found[k].j; x++) numberTokenIdx.add(x);
      i = found[k].j - 1;
    } else out.push(tokens[i]);
  }
  return { slots, masked: out.join(' '), tokens, numberTokenIdx, unitTokenIdx: unitIdx };
}

export const fmtSlot = (s: { value: number; unit: Unit }) => (s.unit === 'rupees' ? `₹${s.value}` : `${s.value} kg`);

/** Substitutes placeholders back after verification. */
export function unmask(text: string, slots: NumSlot[]): string {
  let s = text;
  for (const sl of slots) s = s.split(sl.id).join(String(sl.value));
  return s;
}
