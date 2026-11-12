import { describe, expect, it } from 'vitest';
import { ACTS, buildPhrase, REGISTERS } from '../src/data/acts';
import { classifyRegister } from '../src/engine/register';
import { LANGS } from '../src/i18n';

describe('register classifier agrees with native-authored wording', () => {
  const rows: string[] = [];
  for (const act of ACTS) for (const lang of LANGS) {
    if (!act.w[lang] && !(act.id === 'counter')) continue;
    REGISTERS.forEach((reg) => {
      const p = buildPhrase(act.id, lang, reg, 40);
      if (p.lang !== lang) return;
      const got = classifyRegister(p.text, lang).level;
      const rank = { familiar: 0, neutral: 1, respectful: 2 };
      // The verifier only needs "at least as polite as set" (A2, B5u: less polite than set).
      if (rank[got] < rank[reg]) rows.push(`${act.id} ${lang} want=${reg} got=${got} :: ${p.text}`);
    });
  }
  it('has no disagreements', () => {
    if (rows.length) console.log(rows.join('\n'));
    expect(rows.length).toBe(0);
  });
});
