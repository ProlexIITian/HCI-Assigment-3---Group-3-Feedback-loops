import type { Lang } from '../i18n';
import type { Register } from '../data/acts';

/**
 * Register classifier (Assignment 1 §8.2.4, "a small classifier reads the output and
 * returns its politeness level"). Here it is a transparent marker lexicon per language:
 * honorific pronouns, polite verb endings and softeners push towards Respectful;
 * intimate pronouns, bare imperatives and "hey" forms push towards Familiar.
 * `w:` markers must match a whole word; the rest match as substrings.
 */
const M: Record<Lang, { r: string[]; f: string[] }> = {
  hi: {
    r: ['आप', 'भाई साहब', 'भैया जी', 'कृपया', 'दीजिए', 'दीजिये', 'कीजिए', 'लीजिए', 'बोलिए', 'बताइए', 'माफ़ कीजिए', 'मेहरबानी', 'देंगे', 'होंगे', 'होगा?', 'ठीक रहेंगे', 'ठीक रहेगा', 'देखिए'],
    f: ['w:तू', 'तेरा', 'अरे', 'यार', 'लगा लो', 'लोगे', 'छोड़ो', 'दबाओ', 'चखाओ', 'w:चलो', 'किधर', 'सीधा बोलो', 'भिजवा दो'],
  },
  mr: {
    r: ['आपण', 'आपल्या', 'कृपया', 'द्याल का', 'कराल का', 'बघाल का', 'दाखवाल', 'सांगाल', 'बोलाल', 'घालाल', 'पोचवाल', 'माफ करा', 'काका', 'बरं होईल', 'आहात', 'चालतील का', 'असतील का', 'जमणार नाही', 'आभार', 'तुमचे', 'w:आपण'],
    f: ['w:तू', 'तुला', 'अरे', 'लावा', 'टाका', 'दाबा', 'सोडा', 'हायत', 'w:हाय', 'कुठंय', 'w:चला', 'जरा चाखू', 'सरळ सांगा', 'w:राहू दे'],
  },
  gu: {
    r: ['w:આપ', 'આપની', 'આપને', 'આપશો', 'કરશો', 'બતાવશો', 'કહેશો', 'જોશો', 'બોલશો', 'નાખશો', 'પહોંચાડી આપશો', 'મહેરબાની', 'માફ કરજો', 'કાકા', 'ચાલશે?', 'થઈ શકશે', 'આપનો', 'આપણે', 'જરા કહેશો'],
    f: ['w:તું', 'તને', 'અરે', 'લગાવો', 'દબાવો', 'છોડો', 'ચખાડો', 'w:ચાલો', 'છે કે', 'લેશો?', 'સીધું કહો', 'મોકલી દો', 'હજી થોડું!', 'ધીમે!'],
  },
  bn: {
    r: ['আপনি', 'আপনার', 'দেবেন', 'দেখাবেন', 'বলবেন', 'দয়া করে', 'কিছু মনে করবেন না', 'পারি?', 'আছেন', 'আপনাকে', 'চলবে কি'],
    f: ['w:তুই', 'দাও', 'ধরো', 'ছাড়ো', 'আরে', 'নেবে', 'চলো', 'দেখাও', 'চাখাও', 'টেপো', 'বলো', 'আস্তে!', 'কী খবর'],
  },
  en: {
    r: ['sir', 'please', 'could you', 'would', 'may i', 'sorry', 'excuse me', 'brother', 'perhaps', 'all right', 'good morning'],
    f: ['hey', 'come on', 'gimme', 'nah', 'got any', 'got this', 'got change', 'mate', "that’s it", 'bag it', 'tap the number', 'slower!', 'bit more!', 'just the short', 'deal!', 'bye!', 'thanks!', 'when?', 'wrong one!', 'weight’s short', 'cash, here', 'let me taste', 'send it home', 'make it', 'just ₹', 'upi fine'],
  },
};

const isLatin = (s: string) => /^[\x00-\x7F₹’]+$/.test(s);
function hit(text: string, marker: string): boolean {
  const whole = marker.startsWith('w:');
  const m = whole ? marker.slice(2) : marker;
  if (whole) {
    const words = text.split(/[\s,.!?।।"“”]+/);
    return words.includes(m);
  }
  if (isLatin(m)) return new RegExp(`(^|[^a-z])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(text);
  return text.includes(m);
}

export interface RegisterReading { level: Register; score: number; markers: string[] }

export function classifyRegister(text: string, lang: Lang): RegisterReading {
  const t = text.toLowerCase();
  const { r, f } = M[lang];
  const rm = r.filter((m) => hit(t, m.toLowerCase()));
  const fm = f.filter((m) => hit(t, m.toLowerCase()));
  // Prosodic cue in writing: an exclamatory line with no honorific reads as familiar.
  const excl = rm.length === 0 && /!\s*$/.test(t) ? ['!'] : [];
  const score = rm.length - fm.length - excl.length;
  const level: Register = score >= 1 ? 'respectful' : score <= -1 ? 'familiar' : 'neutral';
  return { level, score, markers: [...rm.map((m) => `+${m.replace('w:', '')}`), ...fm.map((m) => `−${m.replace('w:', '')}`), ...excl.map(() => '−!')] };
}

/**
 * Register drift: what a compressed model does when politeness "leaks" in decoding.
 * Used only by the compression simulator so the verifier has something real to catch.
 */
const DRIFT: Record<Lang, [string, string][]> = {
  hi: [['भाई साहब', 'अरे भैया'], ['भैया जी', 'अरे भैया'], ['दे दीजिए', 'दे दो'], ['कर दीजिए', 'कर दो'], ['कीजिए', 'करो'], ['दीजिए', 'दो'], ['कृपया ', ''], ['आपके', 'तेरे'], ['आप', 'तू'], ['बताइए', 'बता'], ['बोलिए', 'बोल'], ['ठीक रहेंगे', 'चलेंगे'], ['मेहरबानी', 'बात']],
  mr: [['दादा,', 'अरे दादा,'], ['काका,', 'अरे,'], ['द्याल का', 'दे'], ['कराल का', 'कर'], ['कृपया ', ''], ['आपण', 'तू'], ['माफ करा', 'हे बघ'], ['चालतील का', 'चालतील']],
  gu: [['ભાઈ,', 'અરે ભાઈ,'], ['કાકા,', 'અરે,'], ['આપશો', 'આપો ને'], ['કરશો', 'કર'], ['મહેરબાની કરીને ', ''], ['માફ કરજો', 'જો'], ['ચાલશે?', 'ચાલશે.']],
  bn: [['দেবেন', 'দে'], ['আপনি', 'তুই'], ['দয়া করে ', ''], ['দাদা,', 'আরে দাদা,']],
  en: [['Sir, ', 'Hey, '], ['sir', 'mate'], ['could you please', 'just'], ['would ', 'just '], ['please', ''], ['all right', 'fine']],
};

export function driftRegister(text: string, lang: Lang): string {
  let s = text;
  for (const [a, b] of DRIFT[lang]) s = s.split(a).join(b);
  return s;
}
