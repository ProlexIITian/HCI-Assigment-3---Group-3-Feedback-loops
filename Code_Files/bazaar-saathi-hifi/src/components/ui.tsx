import React from 'react';
import { REGISTERS, type Register } from '../data/acts';
import { useApp } from '../store';
import type { Trust } from '../engine/verifier';

export function TopBar({ title, showBack = true, right }: { title?: string; showBack?: boolean; right?: React.ReactNode }) {
  const { back, t, settings } = useApp();
  return (
    <div className="topbar">
      {showBack ? (
        <button className="back" data-back onClick={back} aria-label={t('back')}>← {t('back')}</button>
      ) : null}
      <h1>{title ?? 'Bazaar Saathi'}</h1>
      {right ?? (settings.engine === 'cloud' ? <span className="badge cloud">☁ {t('cloud')}</span> : <span className="badge">✈ {t('offline')}</span>)}
    </div>
  );
}

export function Screen({ children, footer, seller }: { children: React.ReactNode; footer?: React.ReactNode; seller?: boolean }) {
  return (
    <div className={`screen${seller ? ' seller-view' : ''}`}>
      {children}
      {footer ? <div className="footer">{footer}</div> : null}
    </div>
  );
}

type Variant = 'primary' | 'accent' | 'default' | 'test' | 'danger' | 'ghost';
export function Btn({ label, sub, icon, variant = 'default', onClick, big, disabled, col, style, ariaLabel }: { label: React.ReactNode; sub?: string; icon?: string; variant?: Variant; onClick?: () => void; big?: boolean; disabled?: boolean; col?: boolean; style?: React.CSSProperties; ariaLabel?: string }) {
  return (
    <button className={`btn ${variant}${big ? ' big' : ''}${col ? ' col' : ''}`} onClick={onClick} disabled={disabled} style={style} aria-label={ariaLabel}>
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>
        {label}
        {sub ? <span className="sub">{sub}</span> : null}
      </span>
    </button>
  );
}

export function TestBtn(props: { label: string; onClick: () => void }) {
  const { settings } = useApp();
  if (!settings.showTest) return null;
  return <Btn variant="test" label={`TEST ONLY · ${props.label}`} onClick={props.onClick} />;
}

export function RegisterSwitch({ onChange, value }: { onChange?: (r: Register) => void; value?: Register }) {
  const { reg, setReg, t } = useApp();
  const cur = value ?? reg;
  return (
    <div>
      <div className="label" style={{ marginBottom: 4 }}>{t('politeness')}</div>
      <div className="seg" role="group" aria-label={t('politeness')}>
        {REGISTERS.map((r) => (
          <button key={r} aria-pressed={cur === r} onClick={() => (onChange ? onChange(r) : setReg(r))}>
            {cur === r ? '✓ ' : ''}{t(r)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Digits({ children, size }: { children: React.ReactNode; size?: 'sm' | 'xl' }) {
  return <div className={`digits${size ? ` ${size}` : ''}`}>{children}</div>;
}

export function SharedNumber() {
  const { t, shared, qty } = useApp();
  return (
    <div className="card dashed center" aria-live="polite">
      <span className="small">{t('sharedNumber')}</span>
      <Digits size="sm">{shared == null ? '—' : `₹ ${shared}`}{qty ? <span style={{ fontSize: 22 }}> · {qty} kg</span> : null}</Digits>
    </div>
  );
}

export function BottomBar() {
  const { t, startListen, replayLast, push, sol, pickAct, bNumberOnly } = useApp();
  return (
    <nav className="bottombar" aria-label="shortcuts">
      <button onClick={() => startListen('buyer')}><span className="ic">🎤</span>{t('speak')}</button>
      <button onClick={() => (sol === 'A' ? pickAct('counter') : bNumberOnly())}><span className="ic">🔢</span>{t('number')}</button>
      <button onClick={replayLast}><span className="ic">🐢</span>{t('slow')}</button>
      <button onClick={() => push('history')}><span className="ic">🕘</span>{t('history')}</button>
    </nav>
  );
}

export const TRUST_SYM: Record<Trust, string> = { verified: '✓', unchecked: '!', blocked: '✕' };

export function TrustBanner({ state, sub }: { state: Trust; sub?: string }) {
  const { t } = useApp();
  return (
    <div className={`trust ${state}`} role="status">
      <div className="sym" aria-hidden>{TRUST_SYM[state]}</div>
      <div>
        <div className="h2">{t(state)}</div>
        {sub ? <div className="small" style={{ color: 'inherit' }}>{sub}</div> : null}
      </div>
    </div>
  );
}

export function TrustPill({ state }: { state: Trust }) {
  const { t } = useApp();
  return <span className={`pill ${state}`}>{TRUST_SYM[state]} {t(state)}</span>;
}

export function Keypad({ onDigit, onBack }: { onDigit: (d: number) => void; onBack: () => void }) {
  return (
    <div className="keypad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => <button key={d} onClick={() => onDigit(d)}>{d}</button>)}
      <button onClick={onBack} aria-label="backspace">⌫</button>
      <button onClick={() => onDigit(0)}>0</button>
      <span />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function Likert({ n = 5, value, onChange, low, high }: { n?: number; value: number | null; onChange: (v: number) => void; low?: string; high?: string }) {
  return (
    <div>
      <div className="likert" style={{ ['--n' as string]: n }}>
        {Array.from({ length: n }, (_, i) => i + 1).map((v) => (
          <button key={v} aria-pressed={value === v} onClick={() => onChange(v)}>{v}</button>
        ))}
      </div>
      {low || high ? <div className="row small" style={{ marginTop: 2 }}><span>{low}</span><span style={{ textAlign: 'right' }}>{high}</span></div> : null}
    </div>
  );
}
