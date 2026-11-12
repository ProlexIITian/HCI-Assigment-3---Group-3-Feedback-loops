import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { Btn, Field, Likert, Screen, TopBar } from '../components/ui';
import { decisionRules, download, exportCsv, fmt, summarise, SUS_ITEMS, susScore, TASKS, type Outcome, type Participant, type Post, type Proto } from '../services/study';
import { VerifierArm } from './b';
import type { Precision } from '../engine/compression';

export const ETHICS = `Participation is voluntary. You can stop at any time without giving a reason, and nothing happens if you do. We test the app, not you. We do not record audio or video and we do not collect your name, phone number or any sensitive data; you are identified only by a random code (e.g. P03-7KQ). Speech you say into the app is used only to run the task and is not stored. Sessions take about 20 minutes; tell us if you feel tired or uncomfortable and we will pause. The anonymised task logs are used only for the CS 435 course report.`;

/** Study home: participants, ethics, export. */
export function StudyHome() {
  const { participants, push, reset, setActive, activePid, deleteAllStudy } = useApp();
  const [confirmDel, setConfirmDel] = useState(false);
  const exportAll = () => {
    const c = exportCsv(participants);
    download('tasks.csv', c.tasks);
    setTimeout(() => download('questionnaires.csv', c.quest), 300);
    setTimeout(() => download('participants.csv', c.people), 600);
    setTimeout(() => download('study_raw.json', JSON.stringify(participants, null, 2), 'application/json'), 900);
  };
  return (
    <Screen>
      <TopBar title="Usability study" right={<button className="back" onClick={() => reset('launch')}>⌂</button>} showBack={false} />
      <div className="content">
        <div className="card outline">
          <div className="label">How a session runs</div>
          <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Read the consent text aloud; create a participant (random code, counterbalanced order).</li>
            <li>Run the tasks of the first prototype from the facilitator panel; read each instruction as written.</li>
            <li>After each task: Single Ease Question (1–7). After each prototype: SUS + comfort (+ trust symbols for B).</li>
            <li>Finish with preference and, for buyer–seller pairs, the seller questions. Export CSV.</li>
          </ol>
        </div>
        <Btn icon="➕" label="New participant" variant="primary" big onClick={() => push('study.consent')} />
        <div className="label">Participants ({participants.length})</div>
        {participants.map((p) => (
          <button key={p.pid} className="tile wide" onClick={() => setActive(p.pid)} style={p.pid === activePid ? { borderColor: 'var(--accent)', borderWidth: 3 } : undefined}>
            <span className="ic">{p.pid === activePid ? '▶' : '👤'}</span>
            <span><b>{p.pid}</b> · {p.order.join('→')} · {p.role}<br /><span className="small">{p.tasks.length}/{TASKS.length} tasks · SUS A {fmt(susScore(p.post.A?.sus ?? [null]) ?? NaN, 0)} · B {fmt(susScore(p.post.B?.sus ?? [null]) ?? NaN, 0)} · prefers {p.final.prefer || '–'}</span></span>
          </button>
        ))}
        <div className="row">
          <Btn icon="📊" label="Results" onClick={() => push('study.results')} />
          <Btn icon="⬇" label="Export CSV + JSON" onClick={exportAll} disabled={!participants.length} />
        </div>
        <Btn label={confirmDel ? 'Tap again to delete ALL study data' : 'Delete all study data'} variant="danger" onClick={() => (confirmDel ? (deleteAllStudy(), setConfirmDel(false)) : setConfirmDel(true))} />
        <p className="small">Data stays in this browser until exported. Facilitators: use the panel on the right (or the 🧪 button on a phone).</p>
      </div>
    </Screen>
  );
}

/** Consent + minimal, non-sensitive profile. */
export function StudyConsent() {
  const { createParticipant, reset, participants } = useApp();
  const [c, setC] = useState({ voluntary: false, noSensitive: false, canStop: false, noAudio: false });
  const [role, setRole] = useState<'buyer' | 'pair'>('buyer');
  const [ageBand, setAge] = useState('');
  const [languages, setLangs] = useState('');
  const [smartphone, setPhone] = useState<number | null>(null);
  const [readsLongText, setReads] = useState('');
  const ok = c.voluntary && c.noSensitive && c.canStop && c.noAudio;
  const order = participants.length % 2 === 0 ? 'A → B' : 'B → A';
  const box = (k: keyof typeof c, text: string) => (
    <label className="check" style={{ cursor: 'pointer' }}>
      <input type="checkbox" checked={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.checked })} style={{ width: 24, height: 24, flex: 'none' }} />
      <span>{text}</span>
    </label>
  );
  return (
    <Screen footer={<Btn label={`Agree and start · order ${order}`} variant="primary" big disabled={!ok} onClick={() => { createParticipant({ role, consent: { ...c, at: Date.now() }, profile: { ageBand, languages, smartphone, readsLongText } }); reset('study'); }} />}>
      <TopBar title="Consent" />
      <div className="content">
        <div className="card outline"><div className="label">Read aloud</div><div style={{ lineHeight: 1.5 }}>{ETHICS}</div></div>
        {box('voluntary', 'I take part voluntarily.')}
        {box('canStop', 'I know I can stop at any time.')}
        {box('noSensitive', 'I understand no name or sensitive data is collected.')}
        {box('noAudio', 'I understand no audio or video is recorded.')}
        <div className="label">Session type</div>
        <div className="seg">
          <button aria-pressed={role === 'buyer'} onClick={() => setRole('buyer')}>{role === 'buyer' ? '✓ ' : ''}Buyer (team plays seller)</button>
          <button aria-pressed={role === 'pair'} onClick={() => setRole('pair')}>{role === 'pair' ? '✓ ' : ''}Buyer–seller pair</button>
          <span />
        </div>
        <Field label="Age band (optional)">
          <select value={ageBand} onChange={(e) => setAge(e.target.value)}>
            <option value="">prefer not to say</option><option>18–24</option><option>25–34</option><option>35–49</option><option>50+</option>
          </select>
        </Field>
        <Field label="Languages spoken (optional)"><input type="text" value={languages} onChange={(e) => setLangs(e.target.value)} placeholder="e.g. Marathi, Hindi" /></Field>
        <Field label="Comfort with smartphones (1 = never use, 5 = daily)"><Likert value={smartphone} onChange={setPhone} /></Field>
        <Field label="Reads long text on a phone comfortably?">
          <select value={readsLongText} onChange={(e) => setReads(e.target.value)}>
            <option value="">–</option><option>yes</option><option>numbers only</option><option>with difficulty</option>
          </select>
        </Field>
      </div>
    </Screen>
  );
}

/** After each prototype: SUS, comfort, and (B) trust-symbol comprehension. */
export function StudyPost() {
  const { postProto: proto, savePost, reset, active } = useApp();
  const prev = active?.post[proto];
  const [sus, setSus] = useState<(number | null)[]>(prev?.sus ?? Array(10).fill(null));
  const [comfort, setComfort] = useState<number | null>(prev?.comfort ?? null);
  const [trust, setTrust] = useState<NonNullable<Post['trust']>>(prev?.trust ?? { verified: null, unchecked: null, blocked: null });
  const yn = (k: keyof typeof trust, label: string) => (
    <div>
      <div className="small" style={{ color: 'var(--text)' }}>{label}</div>
      <div className="seg">
        <button aria-pressed={trust[k] === true} onClick={() => setTrust({ ...trust, [k]: true })}>{trust[k] === true ? '✓ ' : ''}Correct</button>
        <button aria-pressed={trust[k] === false} onClick={() => setTrust({ ...trust, [k]: false })}>{trust[k] === false ? '✓ ' : ''}Wrong / confused</button>
        <span />
      </div>
    </div>
  );
  const done = sus.every((x) => x != null) && comfort != null;
  return (
    <Screen footer={<Btn label="Save" variant="primary" big disabled={!done} onClick={() => { savePost(proto, { sus, comfort, trust: proto === 'B' ? trust : undefined }); reset('study'); }} />}>
      <TopBar title={`After prototype ${proto}`} />
      <div className="content">
        {proto === 'B' ? (
          <div className="card outline">
            <div className="label">Trust symbols (ask without reading the words)</div>
            <span className="small">Show each symbol alone and ask: “What does this mean?”</span>
            {yn('verified', '✓  (Verified – speaks on one tap)')}
            {yn('unchecked', '!  (Unchecked – numbers safe, needs a second tap)')}
            {yn('blocked', '✕  (Blocked – will not speak, offers another way)')}
          </div>
        ) : null}
        <Field label="How at ease (vs embarrassed) did you feel using it? 1 = very embarrassed, 5 = completely at ease"><Likert value={comfort} onChange={setComfort} /></Field>
        <div className="label">System Usability Scale (1 = strongly disagree, 5 = strongly agree)</div>
        {SUS_ITEMS.map((q, i) => (
          <Field key={i} label={`${i + 1}. ${q}`}>
            <Likert value={sus[i]} onChange={(v) => setSus(sus.map((x, j) => (j === i ? v : x)))} />
          </Field>
        ))}
        <div className="small">SUS score: {fmt(susScore(sus) ?? NaN, 1)}</div>
      </div>
    </Screen>
  );
}

/** End of session: preference and seller questions. */
export function StudyFinal() {
  const { active, saveFinal, reset } = useApp();
  const [f, setF] = useState<Participant['final']>(active?.final ?? { prefer: '', why: '', sellerSlowed: null, sellerNote: '' });
  return (
    <Screen footer={<Btn label="Save and finish" variant="primary" big disabled={!f.prefer} onClick={() => { saveFinal(f); reset('study'); }} />}>
      <TopBar title="Wrap-up" />
      <div className="content">
        <div className="label">Which would you rather use at a market?</div>
        <div className="grid3">
          {(['A', 'B', 'none'] as const).map((p) => <button key={p} className={`btn ${f.prefer === p ? 'primary' : ''}`} onClick={() => setF({ ...f, prefer: p })}>{p === 'none' ? 'No preference' : `Prototype ${p}`}</button>)}
        </div>
        <Field label="Why? (facilitator writes the participant's words)"><textarea value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} /></Field>
        {active?.role === 'pair' ? (
          <>
            <Field label="Seller: did the exchange slow you down? (1 = not at all, 5 = a lot)"><Likert value={f.sellerSlowed} onChange={(v) => setF({ ...f, sellerSlowed: v })} /></Field>
            <Field label="Seller: what did you have to do?"><textarea value={f.sellerNote} onChange={(e) => setF({ ...f, sellerNote: e.target.value })} /></Field>
          </>
        ) : null}
      </div>
    </Screen>
  );
}

/** Results dashboard: per prototype and per task, plus the A2 §9.3 decision rules. */
export function StudyResults() {
  const { participants } = useApp();
  const sums = (['A', 'B'] as Proto[]).map((p) => summarise(participants, p));
  const rules = decisionRules(participants);
  const pref = { A: 0, B: 0, none: 0 } as Record<string, number>;
  participants.forEach((p) => p.final.prefer && (pref[p.final.prefer] += 1));
  return (
    <Screen>
      <TopBar title="Results" />
      <div className="content">
        {!participants.length ? <div className="small">No sessions yet. Results appear here as soon as tasks are logged.</div> : null}
        <table className="data">
          <thead><tr><th></th><th>A · acts</th><th>B · checked</th></tr></thead>
          <tbody>
            <tr><td>Participants</td><td>{sums[0].n}</td><td>{sums[1].n}</td></tr>
            <tr><td>Task success</td><td>{fmt(sums[0].completion * 100, 0)}%</td><td>{fmt(sums[1].completion * 100, 0)}%</td></tr>
            <tr><td>Time / task (s)</td><td>{fmt(sums[0].meanSec)} ± {fmt(sums[0].sdSec)}</td><td>{fmt(sums[1].meanSec)} ± {fmt(sums[1].sdSec)}</td></tr>
            <tr><td>Slips / task</td><td>{fmt(sums[0].meanSlips, 2)}</td><td>{fmt(sums[1].meanSlips, 2)}</td></tr>
            <tr><td>Slips recovered</td><td>{fmt(sums[0].recoveryRate * 100, 0)}%</td><td>{fmt(sums[1].recoveryRate * 100, 0)}%</td></tr>
            <tr><td>Ease (SEQ 1–7)</td><td>{fmt(sums[0].meanSeq)}</td><td>{fmt(sums[1].meanSeq)}</td></tr>
            <tr><td>SUS (0–100)</td><td>{fmt(sums[0].sus)} ± {fmt(sums[0].susSd)}</td><td>{fmt(sums[1].sus)} ± {fmt(sums[1].susSd)}</td></tr>
            <tr><td>At ease (1–5)</td><td>{fmt(sums[0].comfort)}</td><td>{fmt(sums[1].comfort)}</td></tr>
            <tr><td>Preferred by</td><td>{pref.A}</td><td>{pref.B}</td></tr>
          </tbody>
        </table>
        {sums.map((s) => (
          <div key={s.proto} className="card outline">
            <div className="label">Prototype {s.proto} · per task</div>
            {s.perTask.map((pt) => (
              <div key={pt.id}>
                <div className="row small" style={{ color: 'var(--text)' }}><b>{pt.id}</b><span>n={pt.n} · ✓{pt.success} ~{pt.assisted} ✕{pt.fail}</span><span>{fmt(pt.meanSec)} s · {fmt(pt.meanTaps, 1)} taps · {fmt(pt.meanBacks, 1)} back · SEQ {fmt(pt.meanSeq)}</span></div>
                <div className="bar"><i style={{ width: `${pt.n ? (pt.success / pt.n) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        ))}
        <div className="card outline">
          <div className="label">Decision rules (Assignment 2 §9.3)</div>
          {rules.map((r) => (
            <div key={r.rule} className="small" style={{ color: 'var(--text)' }}>
              <b>{r.triggered == null ? '○' : r.triggered ? '⚠ TRIGGERED' : '✓ not triggered'}</b> — {r.rule}<br /><span style={{ color: 'var(--muted)' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

/** Facilitator panel: tasks, timer, Wizard-of-Oz controls. Docked on wide screens, a sheet on phones. */
export function FacilitatorPanel({ onClose }: { onClose?: () => void }) {
  const app = useApp();
  const { active, activeTask, startTask, endTask, lastFinishedTask, rateTask, openPost, reset, push, wizard, arm, settings, updateSettings, screen, simulateSeller, newConversation } = app;
  const [now, setNow] = useState(Date.now());
  const [seq, setSeq] = useState<number | null>(null);
  const [note, setNote] = useState('');
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(id); }, []);
  const def = activeTask ? TASKS.find((d) => d.id === activeTask.taskId) : null;
  const end = (o: Outcome) => { endTask(o); setSeq(null); setNote(''); };
  return (
    <aside className="fac" aria-label="Facilitator panel">
      <header>
        <b style={{ flex: 1 }}>🧪 Facilitator</b>
        {active ? <span className="badge test">{active.pid} · {active.order.join('→')}</span> : <span className="badge test">demo mode</span>}
        {onClose ? <button className="back" onClick={onClose}>✕</button> : null}
      </header>
      <div className="body">
        {!active ? (
          <div className="small">No participant selected. Use the app freely, or open the study to add one.<br /><br /><button className="btn" onClick={() => { reset('study'); onClose?.(); }}>Open study</button></div>
        ) : null}

        {activeTask && def ? (
          <div className="task active">
            <div className="row" style={{ alignItems: 'center' }}><b>{def.id}</b><span className="timer" style={{ textAlign: 'right' }}>⏱ {((now - activeTask.startedAt) / 1000).toFixed(0)} s</span></div>
            <div style={{ fontSize: 15, lineHeight: 1.45 }}>“{def.instruction}”</div>
            <div className="small">Facilitator: {def.facilitator}</div>
            <div className="small">taps {activeTask.taps} · back {activeTask.backs} · slips {activeTask.slips.length} · recovered {activeTask.recovered}</div>
            <div className={`badge ${activeTask.goalReached ? '' : 'test'}`}>{activeTask.goalReached ? '✓ goal event reached' : `waiting for: ${def.goal}`}</div>
            <div className="grid3">
              <button className="btn" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }} onClick={() => end('success')}>✓ Done</button>
              <button className="btn" onClick={() => end('assisted')}>~ Assisted</button>
              <button className="btn danger" onClick={() => end('fail')}>✕ Gave up</button>
            </div>
          </div>
        ) : null}

        {lastFinishedTask && !activeTask ? (
          <div className="task active">
            <b>{lastFinishedTask.taskId} · {lastFinishedTask.outcome} · {(lastFinishedTask.ms / 1000).toFixed(1)} s</b>
            <div className="small">Single Ease Question: “Overall, how easy or difficult was this task?” (1 = very difficult, 7 = very easy)</div>
            <Likert n={7} value={seq} onChange={setSeq} />
            <textarea placeholder="Observations, quotes (no names)" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="btn primary" onClick={() => { rateTask(seq, note); setSeq(null); setNote(''); }}>Save rating</button>
          </div>
        ) : null}

        {active ? active.order.map((proto) => {
          const tasks = TASKS.filter((d) => d.proto === proto);
          const doneAll = tasks.every((d) => active.tasks.some((x) => x.taskId === d.id));
          return (
            <div key={proto} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3>Prototype {proto}</h3>
              {tasks.map((d) => {
                const log = active.tasks.find((x) => x.taskId === d.id);
                return (
                  <div key={d.id} className={`task${log ? ' done' : ''}`}>
                    <div className="row" style={{ alignItems: 'center' }}>
                      <b>{d.id}</b>
                      {log ? <span className="small">{log.outcome} · {(log.ms / 1000).toFixed(0)} s · SEQ {log.seq ?? '–'}</span> : null}
                      <button className="btn" style={{ minHeight: 36, flex: 'none' }} disabled={!!activeTask} onClick={() => { startTask(d.id); onClose?.(); }}>{log ? 'Redo' : 'Start'}</button>
                    </div>
                    <div className="small">{d.instruction}</div>
                  </div>
                );
              })}
              <button className="btn" disabled={!doneAll || !!activeTask} onClick={() => { openPost(proto); onClose?.(); }}>{active.post[proto] ? '✓ ' : ''}Questionnaire after {proto} (SUS, comfort{proto === 'B' ? ', symbols' : ''})</button>
            </div>
          );
        }) : null}
        {active ? <button className="btn primary" disabled={!active.post.A || !active.post.B} onClick={() => { push('study.final'); onClose?.(); }}>{active.final.prefer ? '✓ ' : ''}Wrap-up: preference{active.role === 'pair' ? ' + seller' : ''}</button> : null}

        <h3>Wizard of Oz</h3>
        {wizard.asr || wizard.verifier || wizard.seller ? <div className="armed">Armed: {[wizard.asr && `recogniser=${wizard.asr}`, wizard.verifier && `verifier=${wizard.verifier}`, wizard.seller && `seller=${wizard.seller}`].filter(Boolean).join(' · ')}</div> : null}
        <div className="small">A · recogniser for the next utterance</div>
        <div className="grid3">
          {(['clear', 'noisy', 'number'] as const).map((k) => <button key={k} className="btn test" onClick={() => arm({ asr: wizard.asr === k ? null : k })}>{wizard.asr === k ? '● ' : ''}{k}</button>)}
        </div>
        <VerifierArm value={wizard.verifier} onChange={(v) => arm({ verifier: v })} />
        <div className="small">Seller reply {screen === 'seller' ? '(fires now)' : '(fires when the seller screen opens)'}</div>
        <div className="row">
          <button className="btn test" onClick={() => (screen === 'seller' ? simulateSeller('clear') : arm({ seller: 'clear' }))}>clear reply</button>
          <button className="btn test" onClick={() => (screen === 'seller' ? simulateSeller('story') : arm({ seller: 'story' }))}>long story</button>
        </div>
        <div className="small">Compression level</div>
        <div className="grid3" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {(['16', '8', '4', '3'] as Precision[]).map((p) => <button key={p} className={`btn ${settings.precision === p ? 'primary' : 'test'}`} onClick={() => updateSettings({ precision: p })}>{p}-bit</button>)}
        </div>
        <div className="row">
          <button className="btn test" onClick={newConversation}>Reset conversation</button>
          <button className="btn test" onClick={() => updateSettings({ showTest: !settings.showTest })}>{settings.showTest ? 'Hide' : 'Show'} on-screen TEST</button>
        </div>
      </div>
    </aside>
  );
}
