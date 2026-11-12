import type { Register } from '../data/acts';
import { ROMAN, type Lang } from '../i18n';

/**
 * Cloud stand-in for the on-device NMT (optional, OFF by default).
 * The proposal runs a distilled model on the phone; we cannot ship one in a web
 * prototype, so a large model (Gemini) can stand in to show OPEN-range translation.
 * It receives the MASKED text (numbers already lifted out) and a register token, and
 * its output goes through the same on-phone verifier. Using it breaks the offline
 * promise, so the app shows a "Cloud stand-in ON" badge and counts every network call.
 */
export interface CloudSettings { mode: 'proxy' | 'direct'; apiKey: string; model: string }
export interface CloudResult { text: string; back: string; confidence: number }

export let networkCalls = 0;

const REG_DEF: Record<Register, string> = {
  respectful: 'RESPECTFUL: honorific pronoun (आप / आपण / આપ / আপনি / "sir"), polite verb endings (दीजिए, द्याल का, આપશો, দেবেন), softeners. Never blunt.',
  neutral: 'NEUTRAL: plain, friendly market speech (तुम-forms / plain imperatives), no honorifics, no slang.',
  familiar: 'FAMILIAR: casual, warm, quick (अरे भैया, चलो), exclamations allowed, never insulting.',
};

function prompt(masked: string, src: Lang, tgt: Lang, reg: Register): string {
  return [
    'You translate one utterance between two people bargaining at an Indian village market.',
    `Source language: ${ROMAN[src]}. Target language: ${ROMAN[tgt]} (native script).`,
    `<register>${reg}</register> ${REG_DEF[reg]}`,
    'Rules:',
    '- Tokens like _NUM1_, _NUM2_ are prices/weights. Copy each one EXACTLY ONCE, unchanged. Never write any digit or number word yourself.',
    '- Keep the social intent (a question stays a question; doubt about quality is asked, not accused).',
    '- Address the other person as the register requires (e.g. भाई साहब / दादा / ભાઈ / দাদা).',
    `Also give "back": a literal back-translation of your output into ${ROMAN[src]}, keeping the _NUMk_ tokens.`,
    'Also give "confidence": 0–1, how sure you are the meaning is preserved.',
    'Reply ONLY with JSON: {"text": "...", "back": "...", "confidence": 0.0}',
    `Utterance: ${masked}`,
  ].join('\n');
}

export async function translateCloud(masked: string, src: Lang, tgt: Lang, reg: Register, cfg: CloudSettings): Promise<CloudResult> {
  networkCalls++;
  let raw: string;
  if (cfg.mode === 'proxy') {
    const r = await fetch('./api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt(masked, src, tgt, reg), model: cfg.model }),
    });
    if (!r.ok) throw new Error(`proxy ${r.status}`);
    raw = (await r.json()).text;
  } else {
    if (!cfg.apiKey) throw new Error('no API key');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(masked, src, tgt, reg) }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
      }),
    });
    if (!r.ok) throw new Error(`gemini ${r.status}`);
    const j = await r.json();
    raw = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  }
  const m = raw.match(/\{[\s\S]*\}/);
  const j = JSON.parse(m ? m[0] : raw);
  return { text: String(j.text ?? ''), back: String(j.back ?? ''), confidence: Number(j.confidence ?? 0.5) };
}
