import { describe, expect, it } from 'vitest';
import { ACTS, REGISTERS } from '../src/data/acts';
import { parse } from '../src/engine/parser';
import { LANGS } from '../src/i18n';

// Round-trip check depends on the recogniser re-reading every authored wording.
const EQUIV: Record<string, string[]> = { counter: ['final', 'qtykg'], final: ['counter'], qtykg: ['counter', 'final'], tooexp: ['final'] };
describe('every authored wording is recognised as its own act', () => {
  const miss: string[] = [];
  for (const a of ACTS) for (const l of LANGS) {
    const w = a.w[l];
    if (!w) continue;
    REGISTERS.forEach((r, i) => {
      const text = w[i].split('{n}').join(a.unit === 'kg' ? '2 kg' : '40');
      const got = parse(text).intents.map((h) => h.id);
      if (!got.includes(a.id) && !(EQUIV[a.id] ?? []).some((e) => got.includes(e))) miss.push(`${a.id} ${l} ${r}: ${text}  [${got.join(',')}]`);
    });
  }
  it('no misses', () => {
    if (miss.length) console.log(miss.join('\n'));
    expect(miss.length).toBe(0);
  });
});
