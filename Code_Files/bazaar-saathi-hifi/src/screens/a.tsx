import { useApp } from '../store';
import { BottomBar, Btn, Digits, Keypad, RegisterSwitch, Screen, SharedNumber, TopBar, TrustBanner } from '../components/ui';
import { ACT, actsOf, FAMILIES, meaningOf, type Chip } from '../data/acts';
import { NATIVE } from '../i18n';
import { hasVoice } from '../services/speech';

/** S2 · Home: the picture grid of ten act families IS the home screen, so the device explains itself. */
export function AHome() {
  const { t, me, pickFamily, reset } = useApp();
  return (
    <Screen footer={<BottomBar />}>
      <TopBar showBack={false} title={t('solA')} right={<button className="back" onClick={() => reset('launch')} aria-label="exit">⏏</button>} />
      <div className="content">
        <RegisterSwitch />
        <SharedNumber />
        <div className="small">{t('tapAnAct')}</div>
        <div className="grid2">
          {FAMILIES.map((f) => (
            <button key={f.id} className="tile" onClick={() => pickFamily(f.id)}>
              <span className="ic" aria-hidden>{f.icon}</span>
              {f.label[me]}
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/** S3a / S3b · the acts of one family. Nothing is spoken here. */
export function AActs() {
  const { t, me, familyId, pickAct } = useApp();
  const fam = FAMILIES.find((f) => f.id === familyId)!;
  return (
    <Screen footer={<BottomBar />}>
      <TopBar title={`${fam.icon} ${fam.label[me]}`} />
      <div className="content">
        <div className="small">{familyId === 'quality' ? 'Ask about goods without accusing.' : t('tapAnAct')}</div>
        {actsOf(familyId).map((a) => (
          <button key={a.id} className="tile wide" onClick={() => pickAct(a.id)}>
            <span className="ic" aria-hidden>{a.icon}</span>
            <span>
              {a.label[me]}
              {a.needsNumber ? <><br /><span className="small">🔢 {t('needsNumber')}</span></> : null}
            </span>
          </button>
        ))}
      </div>
    </Screen>
  );
}

/** S4 / S4e / S4n · keypad (also BK, the number-only route of B). The device never guesses a price. */
export function AKeypad({ numberOnly }: { numberOnly?: boolean }) {
  const { t, me, draft, keyErr, typeDigit, backspace, nudge, setUnit, keypadNext, sendNumberOnly } = useApp();
  const act = ACT[draft.actId];
  const title = numberOnly ? t('numberOnly') : t(draft.unit === 'kg' ? 'enterWeight' : 'enterPrice', { act: act?.label[me] ?? '' });
  return (
    <Screen footer={<Btn label={numberOnly ? `${t('send')} →` : t('next')} variant="primary" big onClick={numberOnly ? sendNumberOnly : keypadNext} />}>
      <TopBar title={title} />
      <div className="content">
        {numberOnly ? <div className="small">{t('numberOnlySub')}</div> : null}
        <div className={`card center ${keyErr ? '' : 'outline'}`} style={keyErr ? { border: '2px solid var(--bad)', background: 'var(--bad-bg)' } : undefined} aria-live="assertive">
          <Digits size="xl">{draft.unit === 'rupees' ? '₹' : ''}{draft.value ?? '—'}{draft.unit === 'kg' ? ' kg' : ''}</Digits>
        </div>
        {keyErr ? <div className="err" role="alert">⚠ {keyErr === 'empty' ? t('errEmpty') : t('errUnheard')}</div> : null}
        {numberOnly || draft.actId === 'counter' || draft.actId === 'final' ? (
          <div className="seg">
            <button aria-pressed={draft.unit === 'rupees'} onClick={() => setUnit('rupees')}>{draft.unit === 'rupees' ? '✓ ' : ''}{t('rupees')}</button>
            <button aria-pressed={draft.unit === 'kg'} onClick={() => setUnit('kg')} disabled={!numberOnly}>{draft.unit === 'kg' ? '✓ ' : ''}{t('kg')}</button>
            <span />
          </div>
        ) : null}
        <div className="row">
          <Btn label="−5" onClick={() => nudge(-5)} />
          <Btn label="+5" onClick={() => nudge(5)} />
        </div>
        <Keypad onDigit={typeDigit} onBack={backspace} />
      </div>
    </Screen>
  );
}

/** S6 · Did you mean? Top three acts as pictures; nothing was spoken. */
export function ADym() {
  const { t, me, candidates, pickCandidate, reset, startListen, back } = useApp();
  return (
    <Screen>
      <TopBar title={t('didYouMean')} />
      <div className="content">
        <div className="err" role="alert" style={{ animation: 'none' }}>🤔 {t('notSure')}</div>
        {candidates.map((c) => (
          <button key={c.actId} className="tile wide" onClick={() => pickCandidate(c)}>
            <span className="ic" aria-hidden>{ACT[c.actId]?.icon}</span>
            <span>{ACT[c.actId]?.label[me]}{c.value != null ? <b style={{ fontSize: 22 }}> · ₹{c.value}</b> : null}</span>
          </button>
        ))}
        <Btn label={t('noneOfThese')} onClick={() => reset('a.home')} />
        <Btn icon="🎤" label={t('tryAgain')} onClick={() => { back(); startListen('buyer'); }} />
      </div>
    </Screen>
  );
}

const SLOT_LABEL: Record<Chip['slot'], string> = { address: 'address', softener: 'softener', price: 'price', hedge: 'hedge', act: 'act' };

/** S7 / S7b · private preview (and B8, a quick phrase in B: pre-written, so always Verified). */
export function Preview() {
  const { t, me, them, reg, draft, sol, quick, currentPhrase, hearFirst, speakAloud, showOnly, push, home, setReg } = useApp();
  const act = ACT[draft.actId];
  const ph = currentPhrase();
  const voice = `${t(reg)} (${reg === 'respectful' ? t('slowerFlatter') : reg === 'familiar' ? t('quicker') : '1×'})`;
  return (
    <Screen>
      <TopBar title={sol === 'B' || quick ? t('quickPhrases') : t('privatePreview')} />
      <div className="content">
        <div className="small">🔒 {t('privatePreview')}</div>
        {sol === 'B' ? <TrustBanner state="verified" sub="Pre-written by a native speaker – nothing to check." /> : null}
        <div className="card center">
          <span style={{ fontSize: 30 }} aria-hidden>{act.icon}</span>
          <div className="h2">{act.label[me]}</div>
          {act.needsNumber && draft.value != null ? <Digits size="sm">{draft.unit === 'kg' ? `${draft.value} kg` : `₹${draft.value}`}</Digits> : null}
        </div>
        <RegisterSwitch onChange={setReg} />
        <div className="card dashed">
          <span className="small">{t('willSay', { lang: NATIVE[ph.lang], register: voice })}</span>
          <div className="say" lang={ph.lang}>{ph.text}</div>
          <span className="small">{t('meaning')}: {meaningOf(draft.actId, me, draft.value)}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {ph.chips.map((c, i) => (
              <span key={i} className={`chip${c.slot === 'price' ? ' num' : ''}`}><span className="tag">{SLOT_LABEL[c.slot]} · {t(c.reg)}</span>{c.text}</span>
            ))}
          </div>
          {ph.sample ? <span className="small" style={{ color: 'var(--bad)' }}>{t('sampleOnly')}</span> : null}
          {!hasVoice(ph.lang) ? <span className="small">🔇 {t('noVoice', { lang: NATIVE[them] })}</span> : null}
        </div>
        <Btn icon="👂" label={t('hearFirst')} onClick={hearFirst} />
        <div className="row">
          <Btn icon="🔊" label={t('speakAloud')} variant="primary" big onClick={speakAloud} />
          <Btn icon="🔇" label={t('showOnly')} sub={t('silent')} big col onClick={showOnly} />
        </div>
        <div className="row">
          {act.needsNumber ? <Btn label={t('editNumber')} onClick={() => push('a.keypad')} /> : null}
          <Btn label={t('cancel')} variant="danger" onClick={home} />
        </div>
      </div>
    </Screen>
  );
}
