'use client';

export default function PokerBackgroundBlue() {
  const scattered = [
    { suit: '♠', x: '6%',  y: '10%', size: '3rem',   opacity: 0.16, rotate: -15 },
    { suit: '♥', x: '90%', y: '6%',  size: '4.2rem', opacity: 0.18, rotate: 20  },
    { suit: '♦', x: '78%', y: '28%', size: '2.2rem', opacity: 0.14, rotate: -8  },
    { suit: '♣', x: '3%',  y: '52%', size: '3.6rem', opacity: 0.16, rotate: 10  },
    { suit: '♠', x: '94%', y: '58%', size: '2.6rem', opacity: 0.15, rotate: 25  },
    { suit: '♥', x: '18%', y: '78%', size: '3.8rem', opacity: 0.14, rotate: -20 },
    { suit: '♦', x: '58%', y: '88%', size: '3rem',   opacity: 0.16, rotate: 12  },
    { suit: '♣', x: '42%', y: '4%',  size: '2.4rem', opacity: 0.13, rotate: -5  },
    { suit: '♠', x: '32%', y: '68%', size: '1.9rem', opacity: 0.12, rotate: 30  },
    { suit: '♥', x: '83%', y: '78%', size: '2.6rem', opacity: 0.15, rotate: -12 },
    { suit: '♦', x: '12%', y: '32%', size: '1.8rem', opacity: 0.12, rotate: 18  },
    { suit: '♣', x: '65%', y: '15%', size: '3.3rem', opacity: 0.14, rotate: -22 },
    { suit: '♠', x: '50%', y: '45%', size: '2rem',   opacity: 0.10, rotate: 8   },
    { suit: '♦', x: '25%', y: '12%', size: '1.6rem', opacity: 0.12, rotate: -30 },
  ];

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
      {/* Scattered filled suit symbols, floating upward */}
      {scattered.map((s, i) => {
        const duration = 14 + (i % 5) * 3; // vary speed: 14s - 26s
        const delay = -(i * 1.7);          // negative delay staggers start position
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              fontSize: s.size,
              color: '#ffffff',
              userSelect: 'none',
              lineHeight: 1,
              animation: `float-up-${i % 5} ${duration}s linear ${delay}s infinite`,
              '--base-opacity': s.opacity,
              '--base-rotate': `${s.rotate}deg`,
            } as React.CSSProperties}
          >
            {s.suit}
          </span>
        );
      })}

      <style>{`
        @keyframes float-up-0 {
          0%   { transform: translateY(0)      rotate(var(--base-rotate)); opacity: 0; }
          10%  { opacity: var(--base-opacity); }
          90%  { opacity: var(--base-opacity); }
          100% { transform: translateY(-110vh) rotate(var(--base-rotate)); opacity: 0; }
        }
        @keyframes float-up-1 {
          0%   { transform: translateY(0)      translateX(0)   rotate(var(--base-rotate)); opacity: 0; }
          10%  { opacity: var(--base-opacity); }
          50%  { transform: translateY(-55vh)  translateX(12px) rotate(var(--base-rotate)); }
          90%  { opacity: var(--base-opacity); }
          100% { transform: translateY(-110vh) translateX(0)   rotate(var(--base-rotate)); opacity: 0; }
        }
        @keyframes float-up-2 {
          0%   { transform: translateY(0)      translateX(0)    rotate(var(--base-rotate)); opacity: 0; }
          10%  { opacity: var(--base-opacity); }
          50%  { transform: translateY(-55vh)  translateX(-14px) rotate(var(--base-rotate)); }
          90%  { opacity: var(--base-opacity); }
          100% { transform: translateY(-110vh) translateX(0)    rotate(var(--base-rotate)); opacity: 0; }
        }
        @keyframes float-up-3 {
          0%   { transform: translateY(0)      rotate(var(--base-rotate)); opacity: 0; }
          10%  { opacity: var(--base-opacity); }
          90%  { opacity: var(--base-opacity); }
          100% { transform: translateY(-110vh) rotate(calc(var(--base-rotate) + 25deg)); opacity: 0; }
        }
        @keyframes float-up-4 {
          0%   { transform: translateY(0)      translateX(0)   rotate(var(--base-rotate)); opacity: 0; }
          10%  { opacity: var(--base-opacity); }
          50%  { transform: translateY(-55vh)  translateX(10px) rotate(var(--base-rotate)); }
          90%  { opacity: var(--base-opacity); }
          100% { transform: translateY(-110vh) translateX(0)   rotate(var(--base-rotate)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}