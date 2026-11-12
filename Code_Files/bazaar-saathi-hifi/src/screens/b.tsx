import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { BottomBar, Btn, Digits, RegisterSwitch, Screen, SharedNumber, TopBar, TrustBanner } from '../components/ui';
import { ACT } from '../data/acts';
import { fmtSlot } from '../engine/numbers';
import { NATIVE } from '../i18n';
import type { Fault } from '../engine/compression';
import type { Key } from '../i18n';

const QUICK = ['hello', 'howmuch', 'fresh', 'tooexp', 'again', 'shownum'];

/** B2 · Home: speak freely; quick phrases stay as a safe, always-verified fallback. */
export function BHome() {
  const { t, me, startListen, pickAct, reset, wizard, arm, settings } = useApp();
  return (
    <Screen footer={<BottomBar />}>
      <TopBar showBack={false} title={t('solB')} right={<button className="back" onClick={() => reset('launch')} aria-label="exit">⏏</button>} />
      <div className="content">
        <RegisterSwitch />
        <button className="mic" onClick={() => startListen('buyer')} aria-label={t('speakFreely')}>🎤</button>
        <div className="h2" style={{ textAlign: 'center' }}>{t('speakFreely')}</div>
        <SharedNumber />
        <div className="label">{t('quickPhrases')}</div>
        <div className="grid3">
          {QUICK.map((id) => (
            <button key={id} className="tile" style={{ minHeight: 84 }} onClick={() => pickAct(id)}>
              <span className="ic" aria-hidden>{ACT[id].icon}</span>
              <span style={{ fontSize: 13 }}>{ACT[id].label[me]}</span>
            </button>
          ))}
        </div>
        {settings.showTest ? <VerifierArm value={wizard.verifier} onChange={(v) => arm({ verifier: v })} /> : null}
      </div>
    </Screen>
  );
}

export function VerifierArm({ value, onChange }: { value: null | 'pass' | Fault; onChange: (v: null | 'pass' | Fault) => void }) {
  const opts: [null | 'pass' | Fault, string][] = [[null, 'Auto (real checks)'], ['pass', 'All 4 pass'], ['register', 'Politeness fails'], ['meaning', 'Meaning lost'], ['number', 'Number lost'], ['lowconf', 'Low confidence']];
  return (
    <div className="card" style={{ background: 'var(--test-bg)', border: '1.5px dashed var(--test-border)' }}>
      <div className="label">TEST ONLY · next verifier outcome</div>
      <div className="grid3">
        {opts.map(([v, l]) => (
          <button key={l} className={`btn test`} style={value === v ? { borderStyle: 'solid', borderColor: 'var(--primary)', color: 'var(--primary)' } : undefined} onClick={() => onChange(v)}>{value === v ? '● ' : ''}{l}</button>
        ))}
      </div>
      <span className="small">Faults are injected into the translator’s real output; the on-phone verifier still has to catch them.</span>
    </div>
  );
}

const CHECK_KEY: Record<string, Key> = { numbers: 'chkNumbers', register: 'chkRegister', round: 'chkRound', conf: 'chkConf' };

/** B4 · four checks run on the phone before anything is spoken. */
export function BCheck() {
  const { t, b, bBusy, heard } = useApp();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (bBusy || !b) return;
    setStep(0);
    const id = setInterval(() => setStep((s) => (s >= 4 ? s : s + 1)), 280);
    return () => clearInterval(id);
  }, [bBusy, b]);
  const v = b?.verification;
  return (
    <Screen>
      <TopBar title={t('checking')} showBack={false} />
      <div className="content">
        <div className="card outline">
          <span className="label">{t('heard')}</span>
          <div className="say" style={{ fontSize: 18 }}>{heard}</div>
          {b ? <div className="small">→ {b.masked}</div> : null}
          {b?.frame.slots.length ? (
            <div>
              <span className="label">{t('numbersLifted')}</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{b.frame.slots.map((s) => <span key={s.id} className="chip num"><span className="tag">{s.id}</span>{fmtSlot(s)}</span>)}</div>
            </div>
          ) : null}
        </div>
        <div className="small">{bBusy ? t('translating') : `${b?.engine === 'cloud' ? 'cloud stand-in' : 'on-phone'} · ${b?.ms ?? 0} ms`}</div>
        <div className="checks">
          {(['numbers', 'register', 'round', 'conf'] as const).map((id, i) => {
            const c = v?.checks.find((x) => x.id === id);
            const state = !c || step <= i ? 'run' : c.pass ? 'pass' : 'fail';
            return (
              <div key={id} className={`check ${state}`}>
                <span className="st">{state === 'pass' ? '✓' : state === 'fail' ? '✕' : '…'}</span>
                <div><b>{t(CHECK_KEY[id])}</b>{state !== 'run' && c ? <div className="small">{c.detail}</div> : null}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

/** B5 / B5u / B5x · the trust contract made visible. */
export function BResult() {
  const app = useApp();
  const { t, b, reg, rerunB, bSpeak, bSpeakAnyway, bSayDifferently, bNumberOnly, hearB, home, them, me } = app;
  const [why, setWhy] = useState(false);
  if (!b) return null;
  const v = b.verification;
  const reason = v.reason ? t(v.reason.key, Object.fromEntries(Object.entries(v.reason.vars ?? {}).map(([k, x]) => [k, k === 'got' || k === 'want' ? t(x as Key) : x]))) : '';
  const sub = v.state === 'verified' ? t('verifiedSub') : v.state === 'unchecked' ? t('uncheckedSub', { reason }) : t('blockedSub', { reason });
  return (
    <Screen>
      <TopBar title={t(v.state)} showBack={false} right={<button className="back" onClick={home}>⌂</button>} />
      <div className="content">
        <TrustBanner state={v.state} sub={sub} />
        <div className="card dashed">
          <span className="small">{t('willTranslateTo', { lang: NATIVE[them] })} · {t(reg)}</span>
          {v.state === 'blocked' ? (
            <div className="say" style={{ textDecoration: 'line-through', opacity: 0.5 }} lang={them}>{v.spoken || '—'}</div>
          ) : (
            <div className="say" lang={them}>{v.spoken}</div>
          )}
          <span className="small">{t('roundTrip')} ({NATIVE[me]}): {b.back}</span>
        </div>
        {b.frame.slots.length ? (
          <div className="card center">
            <span className="small">{t('numbersLifted')}</span>
            <Digits size="sm">{b.frame.slots.map(fmtSlot).join(' · ')}</Digits>
          </div>
        ) : null}
        <RegisterSwitch value={reg} onChange={rerunB} />
        <Btn variant="ghost" label={why ? 'Hide the 4 checks' : 'Why? Show the 4 checks'} onClick={() => setWhy(!why)} />
        {why ? (
          <div className="checks">
            {v.checks.map((c) => (
              <div key={c.id} className={`check ${c.pass ? 'pass' : 'fail'}`}>
                <span className="st">{c.pass ? '✓' : '✕'}</span>
                <div><b>{t(CHECK_KEY[c.id])}</b><div className="small">{c.detail}</div></div>
              </div>
            ))}
            {b.injected.length ? <div className="badge test">compression faults injected: {b.injected.join(', ')}</div> : null}
          </div>
        ) : null}

        {v.state === 'verified' ? (
          <>
            <Btn icon="👂" label={t('hearFirst')} onClick={hearB} />
            <div className="row">
              <Btn icon="🔊" label={t('speakAloud')} variant="primary" big onClick={() => bSpeak(false)} />
              <Btn icon="🔇" label={t('showOnly')} sub={t('silent')} big col onClick={() => bSpeak(true)} />
            </div>
            <Btn icon="🎤" label={t('sayDifferently')} onClick={bSayDifferently} />
          </>
        ) : null}
        {v.state === 'unchecked' ? (
          <>
            <Btn icon="🎤" label={t('sayDifferently')} variant="primary" big onClick={bSayDifferently} />
            <Btn icon="⚡" label={t('quickPhrase')} onClick={home} />
            <div className="row">
              <Btn icon="👂" label={t('hearFirst')} onClick={hearB} />
              <Btn icon="!" label={t('speakAnyway')} onClick={bSpeakAnyway} />
            </div>
          </>
        ) : null}
        {v.state === 'blocked' ? (
          <>
            <Btn icon="🎤" label={t('splitShorter')} variant="primary" big onClick={bSayDifferently} />
            <Btn icon="🔢" label={t('sendNumberOnly')} big onClick={bNumberOnly} />
            <Btn icon="⚡" label={t('quickPhrase')} onClick={home} />
          </>
        ) : null}
      </div>
    </Screen>
  );
}

/** B5c · slip guard: an unchecked sentence needs a second, deliberate tap. */
export function BConfirm() {
  const { t, b, bConfirmSpeak, back, them } = useApp();
  return (
    <Screen>
      <TopBar title={t('unchecked')} />
      <div className="content">
        <TrustBanner state="unchecked" sub={t('confirmUnchecked')} />
        <div className="card dashed"><div className="say" lang={them}>{b?.verification.spoken}</div></div>
        <div style={{ flex: 1 }} />
        <Btn icon="!" label={t('speakUnchecked')} variant="danger" big onClick={bConfirmSpeak} />
        <Btn label={t('cancel')} variant="primary" big onClick={back} />
      </div>
    </Screen>
  );
}

