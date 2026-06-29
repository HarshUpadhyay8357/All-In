'use client';

export default function TurnTimer({ secondsLeft, total = 30 }: { secondsLeft: number; total?: number }) {
  const pct = (secondsLeft / total) * 100;
  const urgent = secondsLeft <= 10;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: urgent ? '#ef4444' : '#fbbf24', fontWeight: 500 }}>
          Your turn
        </span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: urgent ? '#ef4444' : '#fbbf24' }}>
          {secondsLeft}s
        </span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          width: `${pct}%`,
          background: urgent ? '#ef4444' : '#fbbf24',
          transition: 'width 1s linear, background 0.3s',
          boxShadow: urgent ? '0 0 10px rgba(239,68,68,0.6)' : 'none',
        }} />
      </div>
    </div>
  );
}