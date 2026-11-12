import { describe, expect, it } from 'vitest';
import { extractNumbers } from '../src/engine/numbers';
import { classifyAct, parse, readSeller } from '../src/engine/parser';
import { runB } from '../src/engine/pipeline';
import { classifyRegister, driftRegister } from '../src/engine/register';

const base = { engine: 'offline' as const, precision: '16' as const, forced: null, cloud: { mode: 'proxy' as const, apiKey: '', model: 'x' } };

describe('slot extraction', () => {
  it('lifts Marathi number words with units', () => {
    const e = extractNumbers('हे कांदे थोडे जुने दिसतात, मी दोन किलोसाठी चाळीस रुपये देईन');
    expect(e.slots.map((s) => [s.value, s.unit])).toEqual([[2, 'kg'], [40, 'rupees']]);
    expect(e.masked).toContain('_NUM1_');
  });
  it('handles digits in other scripts and ₹', () => {
    expect(extractNumbers('₹४० में दो').slots[0].value).toBe(40);
    expect(extractNumbers('૨ કિલો').slots[0]).toMatchObject({ value: 2, unit: 'kg' });
  });
  it('does not read Hindi "दो" (give) as a number', () => {
    expect(extractNumbers('दे दो भैया').slots.length).toBe(0);
    expect(extractNumbers('दो किलो दे दो').slots[0]).toMatchObject({ value: 2, unit: 'kg' });
  });
});

describe('Solution A act recogniser', () => {
  it('recognises a counter-offer with its price', () => {
    const g = classifyAct(parse('चाळीस रुपयांना द्याल का'));
    expect(g.kind).toBe('sure');
    expect(g.actId).toBe('counter');
    expect(g.value).toBe(40);
  });
  it('asks for the number when it is missing', () => {
    expect(classifyAct(parse('आख़िरी दाम')).kind).toBe('numberMissing');
  });
  it('reads a seller quote and a long story', () => {
    expect(readSeller('पचास रुपये लगेंगे').kind).toBe('quote');
    expect(readSeller('देखिए बहन जी इस बार मंडी में माल बहुत महँगा आया ट्रक का भाड़ा भी बढ़ गया').kind).toBe('unclear');
  });
});

describe('Solution B pipeline + verifier', () => {
  it('Meera scenario is Verified and keeps both numbers', async () => {
    const r = await runB('हे कांदे थोडे जुने दिसतात, मी दोन किलोसाठी चाळीस रुपये देईन', { ...base, src: 'mr', tgt: 'hi', reg: 'respectful' });
    expect(r.verification.state).toBe('verified');
    expect(r.verification.spoken).toContain('40');
    expect(r.verification.spoken).toContain('2');
  });
  it('a forced politeness leak becomes Unchecked', async () => {
    const r = await runB('हे कांदे थोडे जुने दिसतात, मी दोन किलोसाठी चाळीस रुपये देईन', { ...base, src: 'mr', tgt: 'hi', reg: 'respectful', forced: 'register' });
    expect(r.verification.state).toBe('unchecked');
  });
  it('a lost number is Blocked', async () => {
    const r = await runB('मी दोन किलोसाठी चाळीस रुपये देईन', { ...base, src: 'mr', tgt: 'gu', reg: 'respectful', forced: 'number' });
    expect(r.verification.state).toBe('blocked');
  });
  it('a dropped clause is caught by the round trip', async () => {
    const r = await runB('ये प्याज़ थोड़े पुराने लग रहे हैं, दो किलो के चालीस रुपये दूँगी', { ...base, src: 'hi', tgt: 'gu', reg: 'respectful', forced: 'meaning' });
    expect(r.verification.state).toBe('unchecked');
    expect(r.verification.lost.length).toBeGreaterThan(0);
  });
  it('off-domain speech is Blocked, not translated into fluent nonsense', async () => {
    const r = await runB('my cousin is getting married next month in Pune', { ...base, src: 'en', tgt: 'hi', reg: 'respectful' });
    expect(r.verification.state).toBe('blocked');
  });
  it('register drift lowers the classified level', () => {
    const s = 'भाई साहब, थोड़ा कम करके ₹40 में दे दीजिए?';
    expect(classifyRegister(s, 'hi').level).toBe('respectful');
    expect(classifyRegister(driftRegister(s, 'hi'), 'hi').level).not.toBe('respectful');
  });
});
