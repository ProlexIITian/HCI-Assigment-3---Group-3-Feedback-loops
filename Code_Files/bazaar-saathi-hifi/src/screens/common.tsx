import { useEffect, useRef, useState } from 'react';
import { useApp, SIM } from '../store';
import { Btn, Digits, Field, RegisterSwitch, Screen, TestBtn, TopBar, TrustBanner, TrustPill } from '../components/ui';
import { LANGS, NATIVE, ROMAN, type Lang } from '../i18n';
import { asrSupported, hasVoice, listen, ttsSupported, type Listener } from '../services/speech';
import { networkCalls } from '../engine/cloud';
import { FAULT_RATE, type Precision } from '../engine/compression';

/** Launch (S0 / B0): offline, no login. */
export function Launch() {
  const { t, setSol, push } = useApp();
  return (
    <Screen>
      <TopBar showBack={false} title="Bazaar Saathi" />
      <div className="content">
        <div className="card center" style={{ background: 'var(--primary)', color: '#fff', padding: 22 }}>
          <img src="./icon.svg" alt="" width={72} height={72} />
          <div className="h1">Bazaar Saathi</div>
          <div style={{ opacity: 0.9 }}>बाज़ार साथी · बाजार साथी · બજાર સાથી</div>
          <div className="small" style={{ color: '#dfe8ee' }}>{t('tagline')}</div>
        </div>
        <div className="label">{t('chooseSolution')}</div>
        <button className="tile wide" onClick={() => { setSol('A'); push('setup'); }}>
          <span className="ic">🧩</span>
          <span><b>{t('solA')}</b><br /><span className="small">{t('solASub')}</span></span>
        </button>
        <button className="tile wide" onClick={() => { setSol('B'); push('setup'); }}>
          <span className="ic">🛡️</span>
          <span><b>{t('solB')}</b><br /><span className="small">{t('solBSub')}</span></span>
        </button>
        <div className="row">
          <Btn icon="🧪" label={t('study')} variant="test" onClick={() => push('study')} />
          <Btn icon="⚙️" label={t('settings')} onClick={() => push('settings')} />
        </div>
        <p className="small">No login. No account. After the first visit the app, all phrases and the checker run on this phone with the network off.</p>
      </div>
    </Screen>
  );
}

/** S1 / B1: language pair, pack, default politeness (and the trust legend for B). */
export function Setup() {
  const { t, me, them, setMe, setThem, sol, packMb, reset } = useApp();
  const same = me === them;
  return (
    <Screen footer={<Btn label={t('continue')} variant="primary" big disabled={same} onClick={() => reset(sol === 'A' ? 'a.home' : 'b.home')} />}>
      <TopBar title={sol === 'A' ? t('solA') : t('solB')} />
      <div className="content">
        <LangPick label={t('iSpeak')} value={me} onChange={setMe} />
        <LangPick label={t('theySpeak')} value={them} onChange={setThem} />
        {same ? <div className="err">{t('sameLang')}</div> : (
          <div className="card center">
            <span aria-hidden style={{ fontSize: 26 }}>📦</span>
            <b>{t('pack', { pair: `${NATIVE[me]} ↔ ${NATIVE[them]}`, mb: packMb })}</b>
            <span className="small">{sol === 'A' ? 'act recogniser · authored fragments · 3-register voice' : 'speech recogniser · translator · register classifier · voice'}</span>
          </div>
        )}
        <RegisterSwitch />
        {sol === 'B' ? (
          <div className="card outline">
            <div className="label">Trust lights</div>
            <div><span className="pill verified">✓ {t('verified')}</span> <span className="small">{t('verifiedSub')}</span></div>
            <div><span className="pill unchecked">! {t('unchecked')}</span> <span className="small">needs a second, deliberate tap</span></div>
            <div><span className="pill blocked">✕ {t('blocked')}</span> <span className="small">will not speak; offers another way</span></div>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}

function LangPick({ label, value, onChange }: { label: string; value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="lang">
        {LANGS.map((l) => (
          <button key={l} aria-pressed={value === l} onClick={() => onChange(l)}>
            {NATIVE[l]}<span className="r">{ROMAN[l]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** S5 / B3 (and the seller's "speak your answer"): tap to start, tap to stop, no holding. */
export function Listen() {
  const app = useApp();
  const { t, ts, me, them, listenRole, sol, settings, heardText, arm, seller } = app;
  const isSeller = listenRole === 'seller';
  const lang: Lang = isSeller ? them : me;
  const L = isSeller ? ts : t;
  const [on, setOn] = useState(false);
  const [text, setText] = useState('');
  const [typed, setTyped] = useState('');
  const [err, setErr] = useState('');
  const [mode, setMode] = useState<'' | 'on-device' | 'cloud'>('');
  const [showType, setShowType] = useState(!asrSupported());
  const h = useRef<Listener | null>(null);

  useEffect(() => () => h.current?.abort(), []);

  const start = () => {
    setErr('');
    setText('');
    const l = listen({
      lang,
      preferOnDevice: settings.preferOnDevice,
      onText: (x) => setText(x),
      onEnd: (fin) => {
        setOn(false);
        if (fin) heardText(fin);
        else setErr('…');
      },
      onError: (e) => { setErr(e); setOn(false); setShowType(true); },
      onMode: setMode,
    });
    if (l) { h.current = l; setOn(true); } else setShowType(true);
  };
  const stop = () => h.current?.stop();

  const sample = isSeller
    ? [SIM.sellerClear[lang].split('{n}').join(String(seller.draft)), SIM.sellerStory[lang]]
    : sol === 'A' ? [SIM.buyerA[lang]] : [SIM.buyer[lang]];

  return (
    <Screen seller={isSeller}>
      <TopBar title={isSeller ? L('sellerSpeak') : sol === 'B' ? t('speakFreely') : t('speak')} />
      <div className="content" style={{ textAlign: 'center' }}>
        <button className={`mic${on ? ' on' : ''}`} onClick={on ? stop : start} aria-label={on ? L('tapToStop') : L('tapToStart')}>{on ? '■' : '🎤'}</button>
        <div className="h2">{on ? L('listening') : L('tapToStart')}</div>
        {on ? <div className="wave" aria-hidden><i /><i /><i /><i /><i /></div> : null}
        <div className="small">{L('speakInLang', { lang: NATIVE[lang] })}</div>
        {mode ? <div className="small">{mode === 'on-device' ? '🔒 on-device recognition' : '☁ browser recogniser (may use network)'}</div> : null}
        {text ? <div className="card outline" style={{ textAlign: 'left' }}><span className="label">{L('heard')}</span><div className="say" style={{ fontSize: 18 }}>{text}</div></div> : null}
        {err && err !== '…' ? <div className="err">{asrSupported() ? L('micError', { err }) : L('noAsr')}</div> : null}
        {err === '…' ? <div className="small">No speech heard. Tap the microphone and try again.</div> : null}

        {showType ? (
          <div className="card outline" style={{ textAlign: 'left' }}>
            <Field label={L('typeHere')}>
              <textarea value={typed} onChange={(e) => setTyped(e.target.value)} lang={lang} />
            </Field>
            <Btn label={L('useThis')} variant="primary" disabled={!typed.trim()} onClick={() => heardText(typed.trim())} />
          </div>
        ) : (
          <Btn variant="ghost" label={`⌨ ${L('typeInstead')}`} onClick={() => setShowType(true)} />
        )}

        {settings.showTest ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
            <div className="label">TEST ONLY · simulate speech</div>
            {sample.map((x) => <Btn key={x} variant="test" label={`“${x.length > 70 ? x.slice(0, 70) + '…' : x}”`} onClick={() => heardText(x)} />)}
            {!isSeller && sol === 'A' ? (
              <>
                <Btn variant="test" label="Recogniser: clear → counter-offer ₹40" onClick={() => { arm({ asr: 'clear' }); heardText(SIM.buyerA[lang]); }} />
                <Btn variant="test" label="Recogniser: noisy stall → unsure" onClick={() => { arm({ asr: 'noisy' }); heardText(SIM.buyerA[lang]); }} />
                <Btn variant="test" label="Recogniser: number unclear → type it" onClick={() => { arm({ asr: 'number' }); heardText(SIM.buyerA[lang]); }} />
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </Screen>
  );
}

/** S8 / B6: the shared screen, turned to the seller. In HIS language; he installs nothing. */
export function Seller() {
  const { ts, them, history, seller, shared, sol, setSellerDraft, sendSellerPrice, sellerAgree, startListen, simulateSeller, wizard } = useApp();
  const last = [...history].reverse().find((h) => h.who === 'me');
  const [overlay, setOverlay] = useState(true);
  useEffect(() => { const id = setTimeout(() => setOverlay(false), 1400); return () => clearTimeout(id); }, []);
  useEffect(() => {
    if (!wizard.seller) return;
    const id = setTimeout(() => simulateSeller(wizard.seller!), 2600);
    return () => clearTimeout(id);
  }, [wizard.seller, simulateSeller]);
  const d = seller.draft;
  return (
    <Screen seller>
      {overlay ? <div className="turnphone"><div><span className="big">↻</span>{ts('turnPhone')}</div></div> : null}
      <TopBar showBack={false} title={`🧑‍🌾 ${NATIVE[them]}`} />
      <div className="content">
        <div className="card center">
          <span className="label">{ts('customerSays')}</span>
          {seller.mode === 'digits' ? <span className="small">🔢</span> : <div className="say">{last?.text ?? '—'}</div>}
          {sol === 'B' && seller.trust ? <TrustPill state={seller.trust} /> : null}
          {last?.value != null || shared != null ? <Digits size="xl">{last?.unit === 'kg' && last.value != null ? `${last.value} kg` : `₹${shared ?? last?.value}`}</Digits> : null}
        </div>
        <div className="card outline center">
          <span className="label">{ts('yourPrice')}</span>
          <div className="row" style={{ alignItems: 'center', width: '100%' }}>
            <Btn label="−" big onClick={() => setSellerDraft(d - 5)} ariaLabel="minus 5" />
            <Digits>₹{d}</Digits>
            <Btn label="+" big onClick={() => setSellerDraft(d + 5)} ariaLabel="plus 5" />
          </div>
          <div className="row" style={{ width: '100%' }}>
            <Btn label="−1" onClick={() => setSellerDraft(d - 1)} />
            <Btn label="+1" onClick={() => setSellerDraft(d + 1)} />
          </div>
          <span className="small">{ts('sellerHint')}</span>
        </div>
        <Btn label={ts('sendPrice')} variant="primary" big onClick={sendSellerPrice} />
        <div className="row">
          <Btn icon="✅" label={ts('agree')} variant="accent" big onClick={sellerAgree} />
          <Btn icon="🎤" label={ts('sellerSpeak')} big onClick={() => startListen('seller')} />
        </div>
        {wizard.seller ? <div className="badge test">Simulating seller: {wizard.seller === 'story' ? 'long story' : 'clear reply'}…</div> : null}
        <TestBtn label="Seller: clear reply" onClick={() => simulateSeller('clear')} />
        <TestBtn label="Seller: long story" onClick={() => simulateSeller('story')} />
      </div>
    </Screen>
  );
}

/** S9 / B7 (+ S9s / B7s): the reply arrives four ways at once — audio, text, icon, digits. */
export function Reply() {
  const { t, seller, history, replySlow, replaySlow, accept, pickAct, sol, startListen, them, home } = useApp();
  const last = [...history].reverse().find((h) => h.who === 'seller');
  return (
    <Screen footer={<Btn icon="✅" label={t('accept')} variant="primary" big onClick={accept} />}>
      <TopBar title={t('sellerSays')} showBack={false} right={<button className="back" onClick={home}>⌂</button>} />
      <div className="content">
        <div className="card center" aria-live="assertive">
          <div style={{ fontSize: 34 }} aria-hidden>🧑‍🌾 💬 ₹</div>
          {sol === 'B' && seller.trust ? <TrustPill state={seller.trust} /> : null}
          <Digits size="xl">₹{seller.offer}</Digits>
          <div className="say">{last?.meaning}</div>
          <div className="small">🔊 audio · 📳 vibration · {NATIVE[them]}: “{last?.text}”</div>
        </div>
        <Btn icon="🐢" label={t('replaySlow')} sub={replySlow ? t('playingSlow') : '0.7×'} onClick={replaySlow} big />
        <div className="grid2">
          <Btn icon="⇄" label={t('counter')} onClick={() => pickAct('counter')} />
          <Btn icon="⬆️" label={t('tooMuch')} onClick={() => pickAct('tooexp')} />
          <Btn icon="↺" label={t('askAgain')} onClick={() => pickAct('again')} />
          {sol === 'B' ? <Btn icon="🎤" label={t('speak')} onClick={() => startListen('buyer')} /> : <Btn icon="❔" label={t('number')} onClick={() => pickAct('final')} />}
        </div>
      </div>
    </Screen>
  );
}

/** S9b / B7x: the seller could not be understood. The device says so instead of guessing. */
export function NotUnderstood() {
  const { t, seller, repair, sol, them } = useApp();
  return (
    <Screen>
      <TopBar title={t('notUnderstood')} showBack={false} />
      <div className="content">
        {sol === 'B' ? <TrustBanner state="blocked" sub={t('sellerReplyBlocked')} /> : <div className="err">❓ {t('notUnderstood')}</div>}
        <div className="card center">
          <div className="h2">{t('numberHeardNone')}</div>
          <Digits size="sm">₹ —</Digits>
          <div className="small">{t('notUnderstoodSub')}</div>
        </div>
        {seller.heard ? <div className="card outline"><span className="label">{t('heard')} ({NATIVE[them]})</span><div className="small" style={{ color: 'var(--text)' }}>{seller.heard}</div></div> : null}
        <Btn icon="🐢" label={t('speakSlowly')} big onClick={() => repair('slow')} />
        <Btn icon="↺" label={t('sayShorter')} big onClick={() => repair('again')} />
        <Btn icon="🔢" label={t('showNumberScreen')} variant="primary" big onClick={() => repair('shownum')} />
      </div>
    </Screen>
  );
}

/** S10 / B9: deal summary — big digits both people can point at. */
export function Deal() {
  const { t, deal, setQty, qty, pickAct, newConversation, home, settings, updateSettings, them, sol } = useApp();
  const price = deal?.price ?? 0;
  const q = deal?.qty ?? qty ?? 1;
  const total = settings.lot ? price : Math.round(price * q * 100) / 100;
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  return (
    <Screen>
      <TopBar title={t('deal')} showBack={false} />
      <div className="content">
        {sol === 'B' ? <TrustBanner state="verified" sub={`${t('deal')} · ${NATIVE[them]}`} /> : <div className="card center" style={{ background: 'var(--ok-bg)' }}><span style={{ fontSize: 34 }} aria-hidden>🤝</span><div className="h2">{t('deal')}</div></div>}
        <div className="card center">
          <span className="label">{t('price')}</span>
          <Digits size="sm">₹{price}</Digits>
          <div className="seg" style={{ width: '100%' }}>
            <button aria-pressed={!settings.lot} onClick={() => updateSettings({ lot: false })}>{!settings.lot ? '✓ ' : ''}per kg</button>
            <button aria-pressed={settings.lot} onClick={() => updateSettings({ lot: true })}>{settings.lot ? '✓ ' : ''}for all</button>
            <span />
          </div>
        </div>
        <div className="card center">
          <span className="label">{t('qty')}</span>
          <div className="row" style={{ alignItems: 'center', width: '100%' }}>
            <Btn label="−" onClick={() => setQty(q - 0.5)} />
            <Digits size="sm">{q} kg</Digits>
            <Btn label="+" onClick={() => setQty(q + 0.5)} />
          </div>
        </div>
        <div className="card center" style={{ background: 'var(--primary)', color: '#fff' }}>
          <span className="label" style={{ color: '#cfe0ea' }}>{t('total')}</span>
          <Digits size="xl">₹{total}</Digits>
        </div>
        <div className="row">
          <Btn icon="📱" label={t('askUpi')} onClick={() => pickAct('upi')} />
          <Btn icon="💵" label={t('payCash')} onClick={() => pickAct('cash')} />
        </div>
        <div className="small">📶 {offline ? t('noSignalUpi') : 'UPI needs signal on the seller’s side; cash always works.'}</div>
        <div className="row">
          <Btn label={t('backHome')} onClick={home} />
          <Btn label={t('newConversation')} variant="primary" onClick={newConversation} />
        </div>
      </div>
    </Screen>
  );
}

/** S11 / B10: every turn, with its trust state; either person can point back at an offer. */
export function History() {
  const { t, history, replayTurn } = useApp();
  return (
    <Screen>
      <TopBar title={t('history')} />
      <div className="content history">
        {!history.length ? <div className="small">{t('nothingToReplay')}</div> : null}
        {history.map((h) => (
          <div key={h.id} className={`turn ${h.who}`}>
            <span className="who" aria-label={h.who === 'me' ? t('me') : t('seller')}>{h.who === 'me' ? '🙋‍♀️' : '🧑‍🌾'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>{h.meaning}</div>
              <div className="small">{h.silent ? '🔇 ' : '🔊 '}{h.text}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                {h.value != null ? <b style={{ fontSize: 20 }}>{h.unit === 'kg' ? `${h.value} kg` : `₹${h.value}`}</b> : null}
                {h.trust ? <TrustPill state={h.trust} /> : null}
              </div>
            </div>
            <button className="btn" style={{ minWidth: 52 }} onClick={() => replayTurn(h)} aria-label={t('replay')}>▶</button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

/** Settings: engine, compression level, speech, test controls; honest status of voices. */
export function Settings() {
  const { settings: s, updateSettings: u } = useApp();
  return (
    <Screen>
      <TopBar title="Settings" />
      <div className="content">
        <div className="card outline">
          <div className="label">Solution B translator</div>
          <div className="seg">
            <button aria-pressed={s.engine === 'offline'} onClick={() => u({ engine: 'offline' })}>{s.engine === 'offline' ? '✓ ' : ''}On-phone</button>
            <button aria-pressed={s.engine === 'cloud'} onClick={() => u({ engine: 'cloud' })}>{s.engine === 'cloud' ? '✓ ' : ''}Cloud stand-in</button>
            <span />
          </div>
          <span className="small">On-phone: domain-restricted translator stand-in, fully offline. Cloud stand-in: Gemini plays the on-device NMT to show open-range speech; output still passes the on-phone verifier. Network calls so far: {networkCalls}.</span>
          {s.engine === 'cloud' ? (
            <>
              <div className="seg">
                <button aria-pressed={s.cloud.mode === 'proxy'} onClick={() => u({ cloud: { ...s.cloud, mode: 'proxy' } })}>{s.cloud.mode === 'proxy' ? '✓ ' : ''}Server proxy</button>
                <button aria-pressed={s.cloud.mode === 'direct'} onClick={() => u({ cloud: { ...s.cloud, mode: 'direct' } })}>{s.cloud.mode === 'direct' ? '✓ ' : ''}Direct (key)</button>
                <span />
              </div>
              {s.cloud.mode === 'direct' ? (
                <Field label="Gemini API key (stored only in this browser)">
                  <input type="password" value={s.cloud.apiKey} onChange={(e) => u({ cloud: { ...s.cloud, apiKey: e.target.value } })} />
                </Field>
              ) : <span className="small">Run <code>GEMINI_API_KEY=… npm run serve</code> and open the app from that server.</span>}
              <Field label="Model">
                <input type="text" value={s.cloud.model} onChange={(e) => u({ cloud: { ...s.cloud, model: e.target.value } })} />
              </Field>
            </>
          ) : null}
        </div>
        <div className="card outline">
          <div className="label">Model precision (compression simulator)</div>
          <div className="grid2">
            {(['16', '8', '4', '3'] as Precision[]).map((p) => (
              <button key={p} className={`btn ${s.precision === p ? 'primary' : ''}`} onClick={() => u({ precision: p })}>{p}-bit · {Math.round(FAULT_RATE[p] * 100)}% faults</button>
            ))}
          </div>
          <span className="small">Lower precision injects the faults compressed models make silently — politeness leak, dropped clause, rewritten number, low confidence — so the verifier is exercised for real.</span>
        </div>
        <div className="card outline">
          <label className="row" style={{ alignItems: 'center' }}><span>Prefer on-device speech recognition</span><input type="checkbox" style={{ flex: 'none', width: 24, height: 24 }} checked={s.preferOnDevice} onChange={(e) => u({ preferOnDevice: e.target.checked })} /></label>
          <label className="row" style={{ alignItems: 'center' }}><span>Show TEST ONLY (Wizard-of-Oz) controls</span><input type="checkbox" style={{ flex: 'none', width: 24, height: 24 }} checked={s.showTest} onChange={(e) => u({ showTest: e.target.checked })} /></label>
          <label className="row" style={{ alignItems: 'center' }}><span>Sounds (trust tones)</span><input type="checkbox" style={{ flex: 'none', width: 24, height: 24 }} checked={s.sound} onChange={(e) => u({ sound: e.target.checked })} /></label>
        </div>
        <div className="card outline">
          <div className="label">This phone</div>
          <span className="small">Voice input: {asrSupported() ? '✓ available' : '✕ not in this browser (typing works)'} · Voice output: {ttsSupported() ? '✓' : '✕'}</span>
          <span className="small">Voices: {LANGS.map((l) => `${ROMAN[l]} ${hasVoice(l) ? '✓' : '✕'}`).join(' · ')}</span>
          <span className="small">If a voice is missing, install it in Android Settings → Text-to-speech → Google → Install voice data. Text, icons and digits always show.</span>
        </div>
      </div>
    </Screen>
  );
}
