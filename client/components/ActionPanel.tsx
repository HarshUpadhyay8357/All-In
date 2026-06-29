'use client';

import { useState, useEffect } from 'react';

interface ActionPanelProps {
  currentBet: number;
  myChips: number;
  myBet: number;
  onAction: (action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => void;
}

export default function ActionPanel({ currentBet, myChips, myBet, onAction }: ActionPanelProps) {
  const totalStack = myChips + myBet;
  const minRaiseTo = currentBet * 2 || 20;
  const [raiseAmount, setRaiseAmount] = useState(Math.min(totalStack, minRaiseTo));

  useEffect(() => {
    setRaiseAmount(Math.min(totalStack, minRaiseTo));
  }, [currentBet, totalStack]);

  const canCheck = currentBet === 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '24px', padding: '1.5rem', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column', gap: '20px',
      width: '100%', boxSizing: 'border-box',
    }}>
      {/* Primary Actions (Stacked) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={() => onAction('fold')} style={btnStyle('#ef4444')}>Fold</button>
        {canCheck ? (
          <button onClick={() => onAction('check')} style={btnStyle('#64748b')}>Check</button>
        ) : (
          <button onClick={() => onAction('call')} style={btnStyle('#2563eb')}>
            Call {currentBet.toLocaleString()}
          </button>
        )}
      </div>

      <hr style={{ border: '0', borderTop: '1px solid rgba(255,255,255,0.1)', margin: 0 }} />

      {/* Raise Slider Controls (Stacked) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>Raise to</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fbbf24' }}>
            {raiseAmount.toLocaleString()} <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 400 }}>chips</span>
          </span>
        </div>
        
        <input
          type="range"
          min={Math.min(totalStack, currentBet * 2 || 20)}
          max={totalStack}
          step={Math.max(currentBet, 10)}
          value={raiseAmount}
          onChange={e => setRaiseAmount(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer', margin: '4px 0' }}
        />

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onAction('raise', raiseAmount)} style={{ ...btnStyle('#7c3aed'), flex: 1 }}>
            Raise
          </button>
          <button onClick={() => onAction('raise', totalStack)} style={{ ...btnStyle('#dc2626'), flex: 1 }}>
            All-in
          </button>
        </div>
      </div>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
    background: color, color: '#fff', fontWeight: 600, fontSize: '14px',
    width: '100%', boxSizing: 'border-box', transition: 'all 0.15s ease',
    textAlign: 'center', display: 'block', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  };
}