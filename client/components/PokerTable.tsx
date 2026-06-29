'use client';
import { ReactNode } from 'react';

export default function PokerTable({ children }: { children: ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '900px',
      aspectRatio: '16 / 10',
      margin: '0 auto',
      borderRadius: '50%',
      background: 'radial-gradient(ellipse at center, #0d3b3b 0%, #0a2e2e 70%, #061f1f 100%)',
      border: '8px solid #1a1a1a',
      boxShadow: '0 0 0 2px rgba(212,175,55,0.3), 0 20px 60px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.4)',
    }}>
      {children}
    </div>
  );
}