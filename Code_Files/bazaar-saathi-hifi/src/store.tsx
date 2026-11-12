import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ACT, buildPhrase, meaningOf, PACK_MB, SELLER_AGREE, sellerQuote, type Register } from './data/acts';
import { t as tr, type Key, type Lang } from './i18n';
import { classifyAct, parse, readSeller } from './engine/parser';
import { runB, type BResult } from './engine/pipeline';
import type { Fault, Precision } from './engine/compression';
import type { CloudSettings } from './engine/cloud';
import type { Trust } from './engine/verifier';
import { cue, setSound } from './services/feedback';
import { speak, stopSpeaking } from './services/speech';
import { loadStudy, newPid, orderFor, saveStudy, TASKS, type Ev, type Outcome, type Participant, type Proto, type TaskLog } from './services/study';

export type Sol = 'A' | 'B';
export type Screen =
  | 'launch' | 'setup' | 'settings' | 'listen' | 'seller' | 'reply' | 'notunderstood' | 'deal' | 'history'
  | 'a.home' | 'a.acts' | 'a.keypad' | 'a.dym' | 'preview'
  | 'b.home' | 'b.check' | 'b.result' | 'b.confirm' | 'b.number'
  | 'study' | 'study.consent' | 'study.post' | 'study.final' | 'study.results';

export interface Turn {
  id: number;
  who: 'me' | 'seller';
  sol: Sol;
  text: string; // what was said/shown, in the listener's language
  lang: Lang;
  meaning: string; // in the buyer's language
  value: number | null;
  unit: 'rupees' | 'kg';
  reg: Register;
  trust?: Trust;
  silent?: boolean;
  actId?: string;
}

export interface Settings {
  engine: 'offline' | 'cloud';
  precision: Precision;
  cloud: CloudSettings;
  preferOnDevice: boolean;
  showTest: boolean;
  sound: boolean;
  lot: boolean; // deal price is for the whole lot, not per kg
}

export interface Wizard { asr: null | 'clear' | 'noisy' | 'number'; verifier: null | 'pass' | Fault; seller: null | 'clear' | 'story' }

interface State {
  stack: Screen[];
  sol: Sol;
  me: Lang;
  them: Lang;
  reg: Register;
  familyId: string;
  draft: { actId: string; value: number | null; unit: 'rupees' | 'kg' };
  keyErr: null | 'empty' | 'unheard';
  used: string[];
  counterRound: number;
  candidates: { actId: string; value: number | null }[];
  shared: number | null;
  qty: number | null;
  listenRole: 'buyer' | 'seller';
  heard: string;
  b: BResult | null;
  bBusy: boolean;
  afterBlocked: boolean;
  confirmAt: number;
  seller: { draft: number; offer: number | null; heard: string; mode: 'normal' | 'digits'; trust: Trust | null };
  replySlow: boolean;
  quick: boolean;
  history: Turn[];
  deal: { price: number; qty: number } | null;
  toast: string | null;
  settings: Settings;
  wizard: Wizard;
  participants: Participant[];
  activePid: string | null;
  activeTask: TaskLog | null;
  pendingSlip: boolean;
  postProto: Proto;
}

const SETTINGS_KEY = 'bazaar-saathi-settings-v1';
const defaultSettings: Settings = {
  engine: 'offline',
  precision: '8',
  cloud: { mode: 'proxy', apiKey: '', model: 'gemini-2.5-flash' },
  preferOnDevice: true,
  showTest: true,
  sound: true,
  lot: false,
};
function loadSettings(): Settings {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }; } catch { return defaultSettings; }
}

const initial = (): State => ({
  stack: ['launch'],
  sol: 'A',
  me: 'mr',
  them: 'hi',
  reg: 'respectful',
  familyId: 'price',
  draft: { actId: 'counter', value: null, unit: 'rupees' },
  keyErr: null,
  used: [],
  counterRound: 0,
  candidates: [],
  shared: null,
  qty: null,
  listenRole: 'buyer',
  heard: '',
  b: null,
  bBusy: false,
  afterBlocked: false,
  confirmAt: 0,
  seller: { draft: 50, offer: null, heard: '', mode: 'normal', trust: null },
  replySlow: false,
  quick: false,
  history: [],
  deal: null,
  toast: null,
  settings: loadSettings(),
  wizard: { asr: null, verifier: null, seller: null },
  participants: loadStudy(),
  activePid: null,
  activeTask: null,
  pendingSlip: false,
  postProto: 'A',
});

/** Simulated speech for Wizard-of-Oz controls (authored per language). */
export const SIM = {
  buyer: {
    mr: 'हे कांदे थोडे जुने दिसतात, मी दोन किलोसाठी चाळीस रुपये देईन',
    hi: 'ये प्याज़ थोड़े पुराने लग रहे हैं, दो किलो के चालीस रुपये दूँगी',
    gu: 'આ ડુંગળી થોડી જૂની લાગે છે, બે કિલોના ચાલીસ રૂપિયા આપીશ',
    bn: 'এই পেঁয়াজ একটু পুরনো লাগছে, দুই কেজি চল্লিশ টাকায় দেব',
    en: 'These onions look a bit old, I will give 40 rupees for 2 kg',
  } as Record<Lang, string>,
  buyerA: { mr: 'चाळीस रुपयांना द्याल का', hi: 'चालीस रुपये में दे दो', gu: 'ચાલીસ રૂપિયામાં આપશો', bn: 'চল্লিশ টাকায় দিন', en: 'can you give it for 40 rupees' } as Record<Lang, string>,
  sellerClear: { hi: '{n} रुपये लगेंगे, इससे कम नहीं होगा', mr: '{n} रुपये होतील, यापेक्षा कमी नाही', gu: '{n} રૂપિયા થશે, આનાથી ઓછું નહીં', bn: '{n} টাকা লাগবে', en: 'It will be {n} rupees' } as Record<Lang, string>,
  sellerStory: {
    hi: 'देखिए बहन जी, इस बार मंडी में माल बहुत महँगा आया, ट्रक वाले ने भाड़ा भी बढ़ा दिया, बारिश की वजह से आधा माल ख़राब हो गया, अब आप ही बताइए',
    mr: 'ताई, यंदा मार्केटमध्ये माल खूप महाग आला, गाडीभाडं वाढलं, पावसामुळे अर्धा माल खराब झाला, आता तुम्हीच सांगा',
    gu: 'બેન, આ વખતે મંડીમાં માલ બહુ મોંઘો આવ્યો, ટ્રકનું ભાડું વધી ગયું, વરસાદને કારણે અડધો માલ બગડી ગયો, હવે તમે જ કહો',
    bn: 'দিদি, এবার মন্ডিতে মাল খুব দামি এসেছে, ট্রাকের ভাড়াও বেড়েছে, বৃষ্টিতে অর্ধেক মাল নষ্ট হয়ে গেছে, এবার আপনিই বলুন',
    en: 'Look madam, this time the wholesale market was costly, the truck fare went up, and half the stock got spoiled in the rain, so you tell me',
  } as Record<Lang, string>,
};

let turnSeq = 1;

export interface Api extends State {
  screen: Screen;
  t: (k: Key, v?: Record<string, string | number>) => string;
  ts: (k: Key, v?: Record<string, string | number>) => string; // seller-facing
  packMb: number;
  push: (s: Screen) => void;
  replace: (s: Screen) => void;
  back: () => void;
  home: () => void;
  reset: (s: Screen) => void;
  flash: (msg: string) => void;
  setSol: (s: Sol) => void;
  setMe: (l: Lang) => void;
  setThem: (l: Lang) => void;
  setReg: (r: Register) => void;
  updateSettings: (p: Partial<Settings>) => void;
  arm: (p: Partial<Wizard>) => void;
  // A
  pickFamily: (id: string) => void;
  pickAct: (id: string) => void;
  typeDigit: (d: number) => void;
  backspace: () => void;
  nudge: (d: number) => void;
  setUnit: (u: 'rupees' | 'kg') => void;
  keypadNext: () => void;
  startListen: (role?: 'buyer' | 'seller') => void;
  heardText: (text: string) => void;
  pickCandidate: (c: { actId: string; value: number | null }) => void;
  hearFirst: () => void;
  speakAloud: () => void;
  showOnly: () => void;
  currentPhrase: () => ReturnType<typeof buildPhrase>;
  // B
  rerunB: (reg: Register) => void;
  bSpeak: (silent: boolean) => void;
  bSpeakAnyway: () => void;
  bConfirmSpeak: () => void;
  bSayDifferently: () => void;
  bNumberOnly: () => void;
  sendNumberOnly: () => void;
  hearB: () => void;
  // seller
  setSellerDraft: (n: number) => void;
  sendSellerPrice: () => void;
  sellerAgree: () => void;
  simulateSeller: (kind: 'clear' | 'story') => void;
  // reply & deal
  replaySlow: () => void;
  replayLast: () => void;
  replayTurn: (turn: Turn) => void;
  accept: () => void;
  repair: (actId: 'slow' | 'again' | 'shownum') => void;
  setQty: (n: number) => void;
  newConversation: () => void;
  // study
  logEvent: (type: string, detail?: string) => void;
  countTap: (isBack: boolean) => void;
  createParticipant: (p: Pick<Participant, 'role' | 'consent' | 'profile'>) => void;
  setActive: (pid: string | null) => void;
  startTask: (taskId: string) => void;
  endTask: (outcome: Outcome) => void;
  rateTask: (seq: number | null, note: string) => void;
  savePost: (proto: Proto, post: Participant['post'][Proto]) => void;
  saveFinal: (f: Participant['final']) => void;
  deleteAllStudy: () => void;
  openPost: (p: Proto) => void;
  active: Participant | null;
  lastFinishedTask: TaskLog | null;
}

const Ctx = createContext<Api | null>(null);
export function useApp(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(initial);
  const ref = useRef(s);
  ref.current = s;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastFinishedTask, setLastFinished] = useState<TaskLog | null>(null);

  const patch = useCallback((p: Partial<State> | ((st: State) => Partial<State>)) => {
    setS((prev) => {
      const next = { ...prev, ...(typeof p === 'function' ? p(prev) : p) };
      ref.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s.settings)); } catch { /* */ }
    setSound(s.settings.sound);
  }, [s.settings]);
  useEffect(() => saveStudy(s.participants), [s.participants]);

  const api = useMemo<Api>(() => {
    const st = () => ref.current;
    const t = (k: Key, v?: Record<string, string | number>) => tr(st().me, k, v);
    const ts = (k: Key, v?: Record<string, string | number>) => tr(st().them, k, v);

    // ── study logging ──
    const logEvent = (type: string, detail?: string) => {
      const task = st().activeTask;
      if (!task) return;
      const ev: Ev = { t: Date.now() - task.startedAt, type, detail };
      const next: TaskLog = { ...task, events: [...task.events, ev] };
      if (type === 'screen' && detail) next.screens = [...task.screens, detail];
      if (type.startsWith('slip')) { next.slips = [...task.slips, detail ?? type]; patch({ pendingSlip: true }); }
      if (st().pendingSlip && (type.startsWith('send') || type.startsWith('show') || type === 'deal' || type === 'numberOnly' || type.startsWith('repair'))) {
        next.recovered = task.recovered + 1;
        patch({ pendingSlip: false });
      }
      const def = TASKS.find((d) => d.id === task.taskId);
      const key = detail ? `${type}:${detail}` : type;
      if (def && (key === def.goal || type === def.goal)) {
        if (!next.goalReached) cue('verified');
        next.goalReached = true;
      }
      patch({ activeTask: next });
    };
    const slip = (name: string) => logEvent('slip', name);

    // ── navigation ──
    const push = (scr: Screen) => { patch((p) => ({ stack: [...p.stack, scr] })); logEvent('screen', scr); };
    const replace = (scr: Screen) => { patch((p) => ({ stack: [...p.stack.slice(0, -1), scr] })); logEvent('screen', scr); };
    const reset = (scr: Screen) => { patch({ stack: [scr] }); logEvent('screen', scr); };
    const homeScreen = (): Screen => (st().sol === 'A' ? 'a.home' : 'b.home');
    const home = () => { stopSpeaking(); patch({ stack: [homeScreen()], quick: false }); logEvent('screen', homeScreen()); };
    const back = () => {
      stopSpeaking();
      patch((p) => ({ stack: p.stack.length > 1 ? p.stack.slice(0, -1) : p.stack }));
    };
    const flash = (msg: string) => {
      patch({ toast: msg });
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => patch({ toast: null }), 2600);
    };

    const addTurn = (turn: Omit<Turn, 'id'>) => patch((p) => ({ history: [...p.history, { ...turn, id: turnSeq++ }] }));

    // ── A: building and sending a phrase ──
    const currentPhrase = () => {
      const x = st();
      return buildPhrase(x.draft.actId, x.them, x.reg, x.draft.value, new Set(x.used), x.counterRound);
    };
    const goSeller = () => {
      const x = st();
      const start = x.seller.offer ?? (x.shared != null ? x.shared + 10 : 50);
      patch({ seller: { ...x.seller, draft: start, heard: '', trust: x.sol === 'B' ? x.seller.trust : null } });
      push('seller');
    };
    const commitA = (silent: boolean) => {
      const x = st();
      const ph = currentPhrase();
      const d = x.draft;
      if (!silent) void speak(ph.text, ph.lang, x.reg);
      cue('send');
      const isPrice = d.value != null && d.unit === 'rupees';
      patch({
        used: [...x.used, ...ph.chips.map((c) => c.text)],
        counterRound: d.actId === 'counter' ? x.counterRound + 1 : x.counterRound,
        shared: isPrice ? d.value : x.shared,
        qty: d.unit === 'kg' && d.value ? d.value : x.qty,
        seller: { ...x.seller, mode: 'normal', trust: x.sol === 'B' ? 'verified' : null },
        quick: false,
      });
      addTurn({ who: 'me', sol: x.sol, text: ph.text, lang: ph.lang, meaning: meaningOf(d.actId, x.me, d.value), value: d.value, unit: d.unit, reg: x.reg, silent, actId: d.actId, trust: x.sol === 'B' ? 'verified' : undefined });
      logEvent(silent ? 'show' : 'send', d.actId);
      if (['slow', 'again', 'shownum'].includes(d.actId)) logEvent('repair', d.actId);
      if (x.afterBlocked) { logEvent('recover', 'blocked'); patch({ afterBlocked: false }); }
      goSeller();
    };
    const pickAct = (id: string) => {
      const act = ACT[id];
      if (act.needsNumber) {
        patch({ draft: { actId: id, value: null, unit: act.unit ?? 'rupees' }, keyErr: null });
        push('a.keypad');
      } else {
        patch({ draft: { actId: id, value: null, unit: 'rupees' }, quick: st().sol === 'B' });
        push('preview');
      }
    };

    // ── seller side ──
    const toReply = (value: number, text: string, trust: Trust | null) => {
      const x = st();
      cue('reply');
      const meaning = sellerQuote(x.me, value);
      patch({ seller: { ...x.seller, offer: value, heard: text, trust }, shared: value, replySlow: false });
      addTurn({ who: 'seller', sol: x.sol, text, lang: x.them, meaning, value, unit: 'rupees', reg: x.reg, trust: trust ?? undefined });
      void speak(meaning, x.me, 'neutral');
      replace('reply');
    };
    const processSeller = (text: string) => {
      const x = st();
      const r = readSeller(text);
      if (r.kind === 'quote' && r.value != null) return toReply(r.value, text, x.sol === 'B' ? 'verified' : null);
      if (r.kind === 'agree') return finishDeal(x.shared ?? x.seller.draft, 'seller');
      cue(x.sol === 'B' ? 'blocked' : 'error');
      slip('sellerUnclear');
      patch({ seller: { ...x.seller, heard: text, trust: x.sol === 'B' ? 'blocked' : null } });
      addTurn({ who: 'seller', sol: x.sol, text, lang: x.them, meaning: t('numberHeardNone'), value: null, unit: 'rupees', reg: x.reg, trust: x.sol === 'B' ? 'blocked' : undefined });
      replace('notunderstood');
    };
    const finishDeal = (price: number, by: 'me' | 'seller' = 'me') => {
      const x = st();
      stopSpeaking();
      const qty = x.qty ?? 1;
      patch({ deal: { price, qty }, shared: price });
      if (by === 'me') {
        const ph = buildPhrase('accept', x.them, x.reg, null);
        void speak(ph.text, ph.lang, x.reg);
        addTurn({ who: 'me', sol: x.sol, text: ph.text, lang: ph.lang, meaning: meaningOf('accept', x.me, null), value: price, unit: 'rupees', reg: x.reg, actId: 'accept', trust: x.sol === 'B' ? 'verified' : undefined });
      } else {
        addTurn({ who: 'seller', sol: x.sol, text: SELLER_AGREE[x.them], lang: x.them, meaning: SELLER_AGREE[x.me], value: price, unit: 'rupees', reg: x.reg });
      }
      cue('verified');
      logEvent('deal');
      reset('deal');
    };

    // ── B ──
    const runAndShow = async (text: string, regOverride?: Register, rerun = false) => {
      const x = st();
      const forced = rerun ? null : x.wizard.verifier;
      patch({ bBusy: true, wizard: { ...x.wizard, verifier: rerun ? x.wizard.verifier : null } });
      const res = await runB(text, { src: x.me, tgt: x.them, reg: regOverride ?? x.reg, engine: x.settings.engine, precision: x.settings.precision, forced, cloud: x.settings.cloud });
      if (res.cloudError) flash(`Cloud stand-in failed (${res.cloudError}); used the offline engine.`);
      patch({ b: res, bBusy: false });
      return res;
    };
    const announceTrust = (state: Trust) => {
      cue(state);
      logEvent('trust', state);
      if (state !== 'verified') slip(state);
      patch({ afterBlocked: state === 'blocked' ? true : st().afterBlocked });
    };

    const api: Api = {
      ...s,
      screen: s.stack[s.stack.length - 1],
      t, ts,
      packMb: s.sol === 'A' ? PACK_MB.A : PACK_MB.B,
      push, replace, back, home, reset, flash,
      setSol: (sol) => patch({ sol }),
      setMe: (l) => patch({ me: l }),
      setThem: (l) => patch({ them: l }),
      setReg: (r) => { patch({ reg: r }); cue('tap'); logEvent('register', r); },
      updateSettings: (p) => patch((x) => ({ settings: { ...x.settings, ...p } })),
      arm: (p) => patch((x) => ({ wizard: { ...x.wizard, ...p } })),

      pickFamily: (id) => { patch({ familyId: id }); push('a.acts'); },
      pickAct,
      typeDigit: (d) => {
        const x = st();
        const nv = (x.draft.value ?? 0) * 10 + d;
        if (nv > 99999) return;
        patch({ draft: { ...x.draft, value: nv }, keyErr: null });
        cue('tap');
      },
      backspace: () => {
        const x = st();
        if (x.draft.value == null) { patch({ keyErr: 'empty' }); cue('error'); slip('emptyNumber'); return; }
        const nv = Math.floor(x.draft.value / 10);
        patch({ draft: { ...x.draft, value: nv === 0 ? null : nv }, keyErr: null });
      },
      nudge: (d) => {
        const x = st();
        const nv = Math.max(0, (x.draft.value ?? 0) + d);
        patch({ draft: { ...x.draft, value: nv === 0 ? null : nv }, keyErr: null });
        cue('tap');
      },
      setUnit: (u) => patch((x) => ({ draft: { ...x.draft, unit: u } })),
      keypadNext: () => {
        const x = st();
        if (!x.draft.value) { patch({ keyErr: 'empty' }); cue('error'); slip('emptyNumber'); return; }
        if (x.draft.actId === 'number') return api.sendNumberOnly();
        if (x.stack[x.stack.length - 2] === 'preview') back();
        else replace('preview');
      },

      startListen: (role = 'buyer') => { patch({ listenRole: role, heard: '' }); push('listen'); },
      heardText: (text) => {
        const x = st();
        patch({ heard: text });
        logEvent('heard', text.slice(0, 80));
        if (x.listenRole === 'seller') { processSeller(text); return; }
        if (x.sol === 'B') {
          replace('b.check');
          const t0 = Date.now();
          void runAndShow(text).then((res) => {
            // keep B4 on screen long enough to watch the four checks run
            setTimeout(() => {
              const top = st().stack[st().stack.length - 1];
              if (top !== 'b.check') return;
              announceTrust(res.verification.state);
              replace('b.result');
            }, Math.max(0, 1500 - (Date.now() - t0)));
          });
          return;
        }
        // Solution A: classify the act (with an optional Wizard override)
        const g = classifyAct(parse(text));
        const forced = x.wizard.asr;
        patch({ wizard: { ...x.wizard, asr: null } });
        const kind = forced === 'noisy' ? 'unsure' : forced === 'number' ? 'numberMissing' : forced === 'clear' ? 'sure' : g.kind;
        if (kind === 'sure') {
          const actId = forced === 'clear' ? 'counter' : g.actId!;
          const value = forced === 'clear' ? 40 : g.value;
          patch({ draft: { actId, value, unit: ACT[actId]?.unit ?? 'rupees' } });
          replace('preview');
        } else if (kind === 'numberMissing') {
          const actId = g.actId && ACT[g.actId]?.needsNumber ? g.actId : 'counter';
          patch({ draft: { actId, value: null, unit: ACT[actId].unit ?? 'rupees' }, keyErr: 'unheard' });
          cue('error');
          slip('numberUnheard');
          replace('a.keypad');
        } else {
          const cands = g.candidates.length >= 3 ? g.candidates.slice(0, 3) : [...g.candidates, ...[{ actId: 'counter', value: 40 }, { actId: 'howmuch', value: null }, { actId: 'final', value: 40 }]].filter((c, i, arr) => arr.findIndex((z) => z.actId === c.actId) === i).slice(0, 3);
          patch({ candidates: cands.map((c) => ({ ...c, value: c.value ?? (ACT[c.actId]?.needsNumber ? (parse(text).slots[0]?.value ?? 40) : null) })) });
          cue('error');
          slip('recogniserUnsure');
          replace('a.dym');
        }
      },
      pickCandidate: (c) => {
        patch({ draft: { actId: c.actId, value: c.value, unit: ACT[c.actId]?.unit ?? 'rupees' } });
        replace('preview');
      },
      currentPhrase,
      hearFirst: () => { const x = st(); const ph = currentPhrase(); void speak(ph.text, ph.lang, x.reg); logEvent('hearFirst'); },
      speakAloud: () => commitA(false),
      showOnly: () => commitA(true),

      rerunB: (reg) => {
        const x = st();
        patch({ reg });
        if (x.b) void runAndShow(x.b.source, reg, true).then((res) => announceTrust(res.verification.state));
      },
      bSpeak: (silent) => {
        const x = st();
        const r = x.b!;
        const v = r.verification;
        if (!silent) void speak(v.spoken, x.them, x.reg);
        cue('send');
        const price = r.frame.slots.find((z) => z.unit === 'rupees');
        const weight = r.frame.slots.find((z) => z.unit === 'kg');
        patch({ shared: price?.value ?? x.shared, qty: weight?.value ?? x.qty, seller: { ...x.seller, mode: 'normal', trust: v.state }, settings: weight && price ? { ...x.settings, lot: true } : x.settings });
        addTurn({ who: 'me', sol: 'B', text: v.spoken, lang: x.them, meaning: r.back, value: price?.value ?? weight?.value ?? null, unit: price ? 'rupees' : 'kg', reg: x.reg, trust: v.state, silent });
        logEvent(silent ? 'show' : 'send', v.state);
        if (x.afterBlocked) { logEvent('recover', 'blocked'); patch({ afterBlocked: false }); }
        goSeller();
      },
      bSpeakAnyway: () => { patch({ confirmAt: Date.now() }); push('b.confirm'); },
      bConfirmSpeak: () => {
        const x = st();
        const dwell = Date.now() - x.confirmAt;
        if (x.activeTask) patch({ activeTask: { ...x.activeTask, b5cDwellMs: [...x.activeTask.b5cDwellMs, dwell] } });
        logEvent('decide', 'unchecked');
        api.bSpeak(false);
      },
      bSayDifferently: () => {
        const x = st();
        if (x.b?.verification.state === 'unchecked') logEvent('decide', 'unchecked');
        patch({ listenRole: 'buyer', heard: '' });
        patch((p) => ({ stack: [...p.stack.filter((z) => !z.startsWith('b.') || z === 'b.home'), 'listen'] }));
        logEvent('screen', 'listen');
      },
      bNumberOnly: () => {
        const x = st();
        const slot = x.b?.frame.slots.find((z) => z.unit === 'rupees') ?? x.b?.frame.slots[0];
        patch({ draft: { actId: 'number', value: slot?.value ?? null, unit: slot?.unit ?? 'rupees' }, keyErr: null });
        push('b.number');
      },
      sendNumberOnly: () => {
        const x = st();
        const d = x.draft;
        if (!d.value) { patch({ keyErr: 'empty' }); cue('error'); slip('emptyNumber'); return; }
        cue('send');
        patch({ shared: d.unit === 'rupees' ? d.value : x.shared, qty: d.unit === 'kg' ? d.value : x.qty, seller: { ...x.seller, mode: 'digits', trust: 'verified' } });
        addTurn({ who: 'me', sol: x.sol, text: d.unit === 'rupees' ? `₹${d.value}` : `${d.value} kg`, lang: x.them, meaning: t('numberOnly'), value: d.value, unit: d.unit, reg: x.reg, trust: 'verified', silent: true });
        logEvent('numberOnly');
        if (x.afterBlocked) { logEvent('recover', 'blocked'); patch({ afterBlocked: false }); }
        goSeller();
      },
      hearB: () => { const x = st(); if (x.b) void speak(x.b.verification.spoken, x.them, x.reg); logEvent('hearFirst'); },

      setSellerDraft: (n) => patch((x) => ({ seller: { ...x.seller, draft: Math.max(0, Math.min(99999, n)) } })),
      sendSellerPrice: () => { const x = st(); logEvent('sellerSend', String(x.seller.draft)); toReply(x.seller.draft, `₹${x.seller.draft}`, x.sol === 'B' ? 'verified' : null); },
      sellerAgree: () => { const x = st(); finishDeal(x.shared ?? x.seller.draft, 'seller'); },
      simulateSeller: (kind) => {
        const x = st();
        patch({ wizard: { ...x.wizard, seller: null } });
        const n = x.seller.draft;
        const text = kind === 'clear' ? SIM.sellerClear[x.them].split('{n}').join(String(n)) : SIM.sellerStory[x.them];
        logEvent('wizard', `seller:${kind}`);
        processSeller(text);
      },

      replaySlow: () => {
        const x = st();
        patch({ replySlow: true });
        const last = [...x.history].reverse().find((h) => h.who === 'seller');
        if (last) void speak(last.meaning, x.me, 'neutral', 0.7);
        logEvent('slowReplay');
      },
      replayLast: () => {
        const x = st();
        const last = [...x.history].reverse().find((h) => h.who === 'seller') ?? [...x.history].reverse()[0];
        if (!last) return flash(t('nothingToReplay'));
        logEvent('slowReplay');
        if (last.who === 'seller') { patch({ replySlow: true }); void speak(last.meaning, x.me, 'neutral', 0.7); if (last.value != null) push('reply'); }
        else void speak(last.text, last.lang, last.reg, 0.7);
      },
      replayTurn: (turn) => { void speak(turn.who === 'seller' ? turn.meaning : turn.text, turn.who === 'seller' ? st().me : turn.lang, turn.reg); },
      accept: () => { const x = st(); finishDeal(x.seller.offer ?? x.shared ?? 0); },
      repair: (actId) => {
        const x = st();
        logEvent('repair', actId);
        if (actId === 'shownum') {
          const ph = buildPhrase('shownum', x.them, x.reg, null);
          void speak(ph.text, ph.lang, x.reg);
          addTurn({ who: 'me', sol: x.sol, text: ph.text, lang: ph.lang, meaning: meaningOf('shownum', x.me, null), value: null, unit: 'rupees', reg: x.reg, actId: 'shownum', trust: x.sol === 'B' ? 'verified' : undefined });
          patch({ seller: { ...x.seller, mode: 'normal', trust: x.sol === 'B' ? 'verified' : null } });
          patch((p) => ({ stack: [...p.stack.slice(0, -1)] }));
          goSeller();
          return;
        }
        patch((p) => ({ draft: { actId, value: null, unit: 'rupees' }, quick: p.sol === 'B' }));
        replace('preview');
      },
      setQty: (n) => patch((x) => ({ qty: Math.max(0.5, n), deal: x.deal ? { ...x.deal, qty: Math.max(0.5, n) } : x.deal })),
      newConversation: () => {
        const x = st();
        stopSpeaking();
        patch({ history: [], deal: null, shared: null, qty: null, used: [], counterRound: 0, b: null, afterBlocked: false, seller: { draft: 50, offer: null, heard: '', mode: 'normal', trust: null }, draft: { actId: 'counter', value: null, unit: 'rupees' }, keyErr: null, settings: { ...x.settings, lot: false } });
        home();
      },

      logEvent,
      countTap: (isBack) => {
        const x = st();
        if (!x.activeTask) return;
        patch({ activeTask: { ...x.activeTask, taps: x.activeTask.taps + 1, backs: x.activeTask.backs + (isBack ? 1 : 0) } });
      },
      createParticipant: (p) => {
        const x = st();
        const pid = newPid(x.participants);
        const part: Participant = { pid, createdAt: Date.now(), order: orderFor(x.participants.length), ...p, tasks: [], post: {}, final: { prefer: '', why: '', sellerSlowed: null, sellerNote: '' } };
        patch({ participants: [...x.participants, part], activePid: pid });
      },
      setActive: (pid) => patch({ activePid: pid, activeTask: null }),
      startTask: (taskId) => {
        const x = st();
        const def = TASKS.find((d) => d.id === taskId)!;
        stopSpeaking();
        const keepConversation = taskId === 'B-T2' || taskId === 'A-T4';
        patch({
          sol: def.proto,
          wizard: { asr: def.preset?.asr ?? null, verifier: def.preset?.verifier ?? null, seller: def.preset?.seller ?? null },
          activeTask: { taskId, proto: def.proto, startedAt: Date.now(), ms: 0, taps: 0, backs: 0, slips: [], recovered: 0, screens: [], events: [], goalReached: false, outcome: 'fail', seq: null, note: '', b5cDwellMs: [] },
          pendingSlip: false,
          ...(keepConversation ? {} : { history: [], deal: null, shared: null, qty: null, used: [], counterRound: 0, b: null, afterBlocked: false, seller: { draft: 50, offer: null, heard: '', mode: 'normal' as const, trust: null } }),
          stack: [def.proto === 'A' ? 'a.home' : 'b.home'],
        });
        // A-T4 needs a seller reply on screen to replay
        if (taskId === 'A-T4' && !x.history.some((h) => h.who === 'seller')) {
          patch({ shared: 40, seller: { draft: 55, offer: null, heard: '', mode: 'normal', trust: null } });
          setTimeout(() => toReply(55, '₹55', null), 50);
        }
      },
      endTask: (outcome) => {
        const x = st();
        if (!x.activeTask || !x.activePid) return;
        const done: TaskLog = { ...x.activeTask, outcome, ms: Date.now() - x.activeTask.startedAt };
        setLastFinished(done);
        patch({ activeTask: null, participants: x.participants.map((p) => (p.pid === x.activePid ? { ...p, tasks: [...p.tasks.filter((tk) => tk.taskId !== done.taskId), done] } : p)), wizard: { asr: null, verifier: null, seller: null } });
      },
      rateTask: (seq, note) => {
        const x = st();
        const last = lastFinishedTask;
        if (!last || !x.activePid) return;
        patch({ participants: x.participants.map((p) => (p.pid === x.activePid ? { ...p, tasks: p.tasks.map((tk) => (tk.taskId === last.taskId ? { ...tk, seq, note } : tk)) } : p)) });
        setLastFinished(null);
      },
      savePost: (proto, post) => {
        const x = st();
        patch({ participants: x.participants.map((p) => (p.pid === x.activePid ? { ...p, post: { ...p.post, [proto]: post } } : p)) });
      },
      saveFinal: (f) => {
        const x = st();
        patch({ participants: x.participants.map((p) => (p.pid === x.activePid ? { ...p, final: f } : p)) });
      },
      deleteAllStudy: () => patch({ participants: [], activePid: null, activeTask: null }),
      openPost: (proto) => { patch({ postProto: proto }); reset('study.post'); },
      active: s.participants.find((p) => p.pid === s.activePid) ?? null,
      lastFinishedTask,
    };
    return api;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s, lastFinishedTask]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
