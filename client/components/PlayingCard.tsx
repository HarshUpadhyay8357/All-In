'use client'
import Image from "next/image";

interface PlayingCardProps {
  card: string;
  faceDown?: boolean;
  width?: number;
  height?: number;
  dealDelay?: number;
};

export default function PlayingCard({ card, faceDown = false, width = 88, height = 100, dealDelay = 0 }: PlayingCardProps) {

  if (faceDown) {
  return (
    <div style={{
      width, height, borderRadius: '10px', overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255,255,255,0.15)',
    }}>
      <Image
        src="/cards/back.png"
        alt="Card back"
        width={width}
        height={height}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        priority
      />
    </div>
  );
}

  return (
    <div style={{
      height:'88px', width:'70px',
      borderRadius: '10px', overflow: 'hidden',
      boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      animation: `deal-in 0.35s ease-out backwards`,
      animationDelay: `${dealDelay}ms`,
    }}> 
      <Image
        src={`/cards/${card}.png`}
        alt={card}
        width={width}
        height={height}
        style={{ objectFit: 'contain', width: '100%', height: '100%' }}
        priority
      />
    </div>
  )
}