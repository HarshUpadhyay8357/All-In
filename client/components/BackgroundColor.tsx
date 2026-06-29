'use client';

export default function PokerBackgroundBlue() {

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        background: ' linear-gradient(135deg,#0f1f44 0%,#1d3c7d 45%,#0c1733 100%)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
    </div>
  );
}