/**
 * Built-in usability-study kit (CS 435 A3 §D). Implements the pilot planned in
 * Assignment 2 §9: counterbalanced A/B order, the task sheets of Tables 11–12,
 * per-task completion, time, taps, back-presses ("wrong turns"), slips and
 * recoveries, Single Ease Question, SUS and comfort per prototype, trust-symbol
 * comprehension for B, preference, and the three decision rules of §9.3.
 * Data stays in this browser (localStorage) until the facilitator exports it.
 * No names, no audio, no free text from the participant beyond what the
 * facilitator types; participant IDs are random codes.
 */
export type Proto = 'A' | 'B';
export type Outcome = 'success' | 'assisted' | 'fail';

export interface TaskDef {
  id: string;
  proto: Proto;
  instruction: string;
  facilitator: string;
  /** Wizard preset armed when the task starts. */
  preset?: { verifier?: 'pass' | 'register' | 'number'; seller?: 'story'; asr?: 'noisy' };
  goal: string; // event that marks the goal as reached
}

export const TASKS: TaskDef[] = [
  { id: 'A-T1', proto: 'A', instruction: 'You want onions. Greet the seller politely, ask the price, offer 40 rupees, and finish the deal at whatever price you agree. Pay by UPI.', facilitator: 'Play the seller (send ₹50).', goal: 'deal' },
  { id: 'A-T2', proto: 'A', instruction: 'Tell the seller the onions look a bit old, but without anyone nearby hearing it.', facilitator: 'None.', goal: 'show:old' },
  { id: 'A-T3', proto: 'A', instruction: 'Use your voice to make a counter-offer.', facilitator: 'Recogniser is armed as "noisy stall → unsure"; participant recovers and sends the offer.', preset: { asr: 'noisy' }, goal: 'send:counter' },
  { id: 'A-T4', proto: 'A', instruction: 'The seller replied too fast. Hear his reply again more slowly, then reply "too much".', facilitator: 'Send a seller price first if none.', goal: 'send:tooexp' },
  { id: 'A-T5', proto: 'A', instruction: 'Get the seller to show you his price as a number.', facilitator: 'Seller is armed to tell a "long story".', preset: { seller: 'story' }, goal: 'repair:shownum' },
  { id: 'B-T1', proto: 'B', instruction: 'Tell the seller in your own words that the onions look old and you will pay 40 rupees for 2 kg. Finish the deal.', facilitator: 'Verifier armed: all 4 pass.', preset: { verifier: 'pass' }, goal: 'deal' },
  { id: 'B-T2', proto: 'B', instruction: 'Say the same thing again. Decide whether to speak it, and explain why.', facilitator: 'Verifier armed: politeness fails.', preset: { verifier: 'register' }, goal: 'decide:unchecked' },
  { id: 'B-T3', proto: 'B', instruction: 'Get your price across to the seller anyway.', facilitator: 'Verifier armed: Blocked (number lost).', preset: { verifier: 'number' }, goal: 'recover:blocked' },
  { id: 'B-T4', proto: 'B', instruction: 'Get the seller to repeat more briefly.', facilitator: 'Seller is armed to tell a "long story".', preset: { seller: 'story' }, goal: 'repair:again' },
];

export const SUS_ITEMS = [
  'I think that I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think that I would need the support of a technical person to be able to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.',
];

export interface Ev { t: number; type: string; detail?: string }
export interface TaskLog {
  taskId: string;
  proto: Proto;
  startedAt: number;
  ms: number;
  taps: number;
  backs: number;
  slips: string[];
  recovered: number;
  screens: string[];
  events: Ev[];
  goalReached: boolean;
  outcome: Outcome;
  seq: number | null; // Single Ease Question 1–7
  note: string;
  b5cDwellMs: number[];
}
export interface Post { sus: (number | null)[]; comfort: number | null; trust?: { verified: boolean | null; unchecked: boolean | null; blocked: boolean | null } }
export interface Participant {
  pid: string;
  createdAt: number;
  order: Proto[];
  role: 'buyer' | 'pair';
  consent: { voluntary: boolean; noSensitive: boolean; canStop: boolean; noAudio: boolean; at: number };
  profile: { ageBand: string; languages: string; smartphone: number | null; readsLongText: string };
  tasks: TaskLog[];
  post: Partial<Record<Proto, Post>>;
  final: { prefer: '' | 'A' | 'B' | 'none'; why: string; sellerSlowed: number | null; sellerNote: string };
}

const KEY = 'bazaar-saathi-study-v1';
export function loadStudy(): Participant[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
export function saveStudy(ps: Participant[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ps)); } catch { /* storage blocked: data lives in memory until export */ }
}

export function newPid(ps: Participant[]): string {
  const n = ps.length + 1;
  return `P${String(n).padStart(2, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}
/** Counterbalance: odd participants A→B, even B→A. */
export const orderFor = (index: number): Proto[] => (index % 2 === 0 ? ['A', 'B'] : ['B', 'A']);

export function susScore(sus: (number | null)[]): number | null {
  if (sus.some((x) => x == null)) return null;
  let s = 0;
  sus.forEach((v, i) => (s += i % 2 === 0 ? (v as number) - 1 : 5 - (v as number)));
  return s * 2.5;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const sd = (xs: number[]) => {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};
export const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : '–');

export interface Summary {
  proto: Proto;
  n: number;
  completion: number;
  meanSec: number;
  sdSec: number;
  meanSlips: number;
  recoveryRate: number;
  meanSeq: number;
  sus: number;
  susSd: number;
  comfort: number;
  perTask: { id: string; n: number; success: number; assisted: number; fail: number; meanSec: number; meanTaps: number; meanBacks: number; meanSeq: number }[];
}

export function summarise(ps: Participant[], proto: Proto): Summary {
  const logs = ps.flatMap((p) => p.tasks.filter((t) => t.proto === proto));
  const susVals = ps.map((p) => p.post[proto]).filter(Boolean).map((po) => susScore(po!.sus)).filter((x): x is number => x != null);
  const comfort = ps.map((p) => p.post[proto]?.comfort).filter((x): x is number => x != null);
  const slips = logs.reduce((a, t) => a + t.slips.length, 0);
  const rec = logs.reduce((a, t) => a + t.recovered, 0);
  return {
    proto,
    n: new Set(ps.filter((p) => p.tasks.some((t) => t.proto === proto)).map((p) => p.pid)).size,
    completion: logs.length ? logs.filter((t) => t.outcome === 'success').length / logs.length : NaN,
    meanSec: mean(logs.map((t) => t.ms / 1000)),
    sdSec: sd(logs.map((t) => t.ms / 1000)),
    meanSlips: mean(logs.map((t) => t.slips.length)),
    recoveryRate: slips ? rec / slips : NaN,
    meanSeq: mean(logs.map((t) => t.seq).filter((x): x is number => x != null)),
    sus: mean(susVals),
    susSd: sd(susVals),
    comfort: mean(comfort),
    perTask: TASKS.filter((d) => d.proto === proto).map((d) => {
      const ts = logs.filter((t) => t.taskId === d.id);
      return {
        id: d.id,
        n: ts.length,
        success: ts.filter((t) => t.outcome === 'success').length,
        assisted: ts.filter((t) => t.outcome === 'assisted').length,
        fail: ts.filter((t) => t.outcome === 'fail').length,
        meanSec: mean(ts.map((t) => t.ms / 1000)),
        meanTaps: mean(ts.map((t) => t.taps)),
        meanBacks: mean(ts.map((t) => t.backs)),
        meanSeq: mean(ts.map((t) => t.seq).filter((x): x is number => x != null)),
      };
    }),
  };
}

/** Assignment 2 §9.3 decision rules, evaluated on the collected data. */
export function decisionRules(ps: Participant[]) {
  const trust = ps.map((p) => p.post.B?.trust).filter(Boolean) as NonNullable<Post['trust']>[];
  const confused = trust.filter((t) => t.unchecked === false || t.blocked === false).length;
  const dwell = ps.flatMap((p) => p.tasks.flatMap((t) => t.b5cDwellMs));
  const fast = dwell.filter((d) => d < 1500).length;
  const seller = ps.map((p) => p.final.sellerSlowed).filter((x): x is number => x != null);
  return [
    {
      rule: 'If more than a third confuse Unchecked with Blocked → merge the two states',
      value: trust.length ? `${confused}/${trust.length} confused` : 'no data',
      triggered: trust.length ? confused / trust.length > 1 / 3 : null,
    },
    {
      rule: 'If participants routinely tap through B5c without reading (< 1.5 s) → replace with a spoken confirmation',
      value: dwell.length ? `${fast}/${dwell.length} second taps under 1.5 s (median ${fmt(median(dwell) / 1000)} s)` : 'no data',
      triggered: dwell.length ? fast / dwell.length > 0.5 : null,
    },
    {
      rule: 'If sellers feel the exchange slows them down (mean ≥ 4/5) → reduce seller controls to +/− only',
      value: seller.length ? `mean ${fmt(mean(seller))}/5 (n=${seller.length})` : 'no data',
      triggered: seller.length ? mean(seller) >= 4 : null,
    },
  ];
}
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN;
};

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

export function exportCsv(ps: Participant[]) {
  const tasks = toCsv([
    ['pid', 'order', 'role', 'proto', 'task', 'outcome', 'goal_reached', 'seconds', 'taps', 'back_presses', 'slips', 'slip_list', 'recovered', 'seq_1to7', 'b5c_dwell_ms', 'screens', 'note'],
    ...ps.flatMap((p) => p.tasks.map((t) => [p.pid, p.order.join(''), p.role, t.proto, t.taskId, t.outcome, t.goalReached, (t.ms / 1000).toFixed(1), t.taps, t.backs, t.slips.length, t.slips.join(' '), t.recovered, t.seq, t.b5cDwellMs.join(' '), t.screens.join('>'), t.note])),
  ]);
  const quest = toCsv([
    ['pid', 'proto', ...SUS_ITEMS.map((_, i) => `sus${i + 1}`), 'sus_score', 'comfort_1to5', 'trust_verified_ok', 'trust_unchecked_ok', 'trust_blocked_ok'],
    ...ps.flatMap((p) => (['A', 'B'] as Proto[]).filter((x) => p.post[x]).map((x) => {
      const po = p.post[x]!;
      return [p.pid, x, ...po.sus, susScore(po.sus), po.comfort, po.trust?.verified, po.trust?.unchecked, po.trust?.blocked];
    })),
  ]);
  const people = toCsv([
    ['pid', 'created', 'order', 'role', 'age_band', 'languages', 'smartphone_1to5', 'reads_long_text', 'consent_all', 'prefer', 'why', 'seller_slowed_1to5', 'seller_note'],
    ...ps.map((p) => [p.pid, new Date(p.createdAt).toISOString(), p.order.join(''), p.role, p.profile.ageBand, p.profile.languages, p.profile.smartphone, p.profile.readsLongText, p.consent.voluntary && p.consent.noSensitive && p.consent.canStop, p.final.prefer, p.final.why, p.final.sellerSlowed, p.final.sellerNote]),
  ]);
  return { tasks, quest, people };
}

export function download(name: string, content: string, type = 'text/csv') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
