import { useState, type JSX } from 'react';
import { AppProvider, useApp, type Screen } from './store';
import { Deal, History, Launch, Listen, NotUnderstood, Reply, Seller, Settings, Setup } from './screens/common';
import { ADym, AActs, AHome, AKeypad, Preview } from './screens/a';
import { BCheck, BConfirm, BHome, BResult } from './screens/b';
import { FacilitatorPanel, StudyConsent, StudyFinal, StudyHome, StudyPost, StudyResults } from './screens/study';

const SCREENS: Record<Screen, () => JSX.Element | null> = {
  launch: Launch,
  setup: Setup,
  settings: Settings,
  listen: Listen,
  seller: Seller,
  reply: Reply,
  notunderstood: NotUnderstood,
  deal: Deal,
  history: History,
  'a.home': AHome,
  'a.acts': AActs,
  'a.keypad': () => <AKeypad />,
  'a.dym': ADym,
  preview: Preview,
  'b.home': BHome,
  'b.check': BCheck,
  'b.result': BResult,
  'b.confirm': BConfirm,
  'b.number': () => <AKeypad numberOnly />,
  study: StudyHome,
  'study.consent': StudyConsent,
  'study.post': StudyPost,
  'study.final': StudyFinal,
  'study.results': StudyResults,
};

function Shell() {
  const { screen, stack, toast, countTap, activeTask, settings, activePid } = useApp();
  const [sheet, setSheet] = useState(false);
  const Cur = SCREENS[screen];
  return (
    <div className="stage">
      <main
        className="phone"
        onClickCapture={(e) => {
          if (!activeTask) return;
          const el = (e.target as HTMLElement).closest('button');
          if (el) countTap(!!el.closest('[data-back]'));
        }}
      >
        <Cur key={`${stack.length}-${screen}`} />
        {toast ? <div className="toast" role="status">{toast}</div> : null}
      </main>
      <FacilitatorPanel />
      {settings.showTest || activePid || screen.startsWith('study') ? <button className="fac-fab" onClick={() => setSheet(true)} aria-label="Facilitator panel">🧪</button> : null}
      {sheet ? (
        <div className="fac-sheet">
          <FacilitatorPanel onClose={() => setSheet(false)} />
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
