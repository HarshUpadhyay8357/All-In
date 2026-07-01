"use client";
import PokerBackgroundBlue from "@/components/BackgroundColor";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/lib/auth-store";
import { useGameStore } from "@/lib/game-store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PokerTable from '@/components/PokerTable';
import PlayingCard from '@/components/PlayingCard';
import { getSeatPosition } from "@/lib/seat-positions";
import ActionPanel from '@/components/ActionPanel';
import TurnTimer from "@/components/TurnTimer";

const roleBadgeStyle = (bgColor: string, color: string): React.CSSProperties => ({
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  background: bgColor,
  color: color,
  fontSize: '8px',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.25)',
  lineHeight: 1,
});

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string };
  const { user } = useAuthStore();
  const { gameState, myHoleCards, players, secondsLeft, isMyTurn, showdown } = useGameStore();
  const socket = useSocket();
  const router = useRouter();
  const [joined, setjoined] = useState(false);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextHandTimer, setNextHandTimer] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finalWinner = gameState?.phase === 'finished'
    ? (gameState.players.find((p: any) => p.chips > 0) || gameState.players[0])
    : null;

  // Reset submit throttle on game state change
  useEffect(() => {
    setSubmitting(false);
  }, [gameState]);

  // Reset submit throttle on socket errors
  useEffect(() => {
    const handleError = () => {
      setSubmitting(false);
    };
    socket.on("error", handleError);
    return () => {
      socket.off("error", handleError);
    };
  }, [socket]);

  // Countdown timer for next hand start during showdown phase
  useEffect(() => {
    if (showdown) {
      setNextHandTimer(5);
      const interval = setInterval(() => {
        setNextHandTimer((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setNextHandTimer(null);
    }
  }, [showdown]);

  useEffect(() => {
    if (!user || !roomId) return;

    //join the room via socket
    socket.emit("join_room", { roomId, userId: user.id });
    setjoined(true);

    return () => {
      socket.emit("leave_room", { roomId, userId: user.id });
    };
  }, [roomId, user?.id]);

  const handleAction = (
    action: "fold" | "check" | "call" | "raise",
    amount?: number,
  ) => {
    if (submitting) return;
    setSubmitting(true);
    socket.emit("player_action", { roomId, userId: user!.id, action, amount });
  };

  const handleStartGame = () => {
    if (starting) return;
    setStarting(true);
    socket.emit("start_game", { roomId, userId: user!.id });
  };

  const handleRestartGame = () => {
    socket.emit("restart_game", { roomId });
  };

  //show waiting room if game isn't started
  if (!gameState) {
    return (
      <>
        {/* <PokerBackgroundBlue /> */}
        <div className="min-h-screen text-white flex flex-col items-center justify-center gap-6">
          <h1 className="text-3xl font-bold">Waiting Room</h1>
          <p className="text-gray-400 flex items-center gap-2">
            Room: <span className="font-mono bg-white/5 px-2 py-1 rounded text-white">{roomId}</span>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
              title="Copy Room ID"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.6} stroke="currentColor" className="w-4 h-4 text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-3a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125H7.875a1.125 1.125 0 01-1.125-1.125V7.375z" />
                </svg>
              )}
            </button>
          </p>
          <p className="text-gray-400">Players: {players.length}</p>

          <button
            onClick={handleStartGame} disabled={starting}
            className="px-8 py-3 bg-green-600 font-bold rounded-xl text-lg hover:opacity-90"
          >
            {starting ? 'Starting...' : 'Start Game'}
          </button>

          <button
            onClick={() => router.push("/lobby")}
            className="text-gray-400 text-sm"
          >
            ← Back to Lobby
          </button>
        </div>
      </>
    );
  }

  //show game table once game has started
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 40px',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      <PokerBackgroundBlue />

      {/* Split Layout Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        maxWidth: '1450px',
        height: '100%',
        maxHeight: '90vh',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}>
        
        {/* Left Side: Poker Table (65% width) */}
        <div style={{
          width: '65%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 1,
        }}>
          <PokerTable>
            {gameState?.players?.map((p: any) => {
              const pos = getSeatPosition(p.seatNumber, gameState.players.length);
              const isMe = p.id === user?.id;
              const isCurrentTurn = gameState.players[gameState.currentPlayerIndex]?.id === p.id;

              return (
                <div
                  key={p.id} 
                  style={{
                    position: 'absolute',
                    left: pos.left,
                    top: pos.top,
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    zIndex: isMe ? 10 : 1,
                  }}
                >
                  <div style={{
                    padding: isMe ? '8px 14px' : '6px 12px',
                    borderRadius: '12px',
                    background: isCurrentTurn 
                      ? (isMe ? 'rgba(59,130,246,0.2)' : 'rgba(124,58,237,0.2)') 
                      : 'rgba(0,0,0,0.5)',
                    border: isMe 
                      ? '2px solid #3b82f6' 
                      : `2px solid ${isCurrentTurn ? '#a78bfa' : 'rgba(255,255,255,0.15)'}`,
                    boxShadow: isMe 
                      ? '0 0 15px rgba(59,130,246,0.3)' 
                      : (isCurrentTurn ? '0 0 20px rgba(124,58,237,0.4)' : 'none'),
                    minWidth: isMe ? '125px' : '95px',
                    position: 'relative',
                  }}>
                    {/* Role Badges (D, SB, BB) */}
                    {(p.isDealer || p.isSmallBlind || p.isBigBlind) && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        display: 'flex',
                        gap: '3px',
                        zIndex: 15,
                      }}>
                        {p.isDealer && <span style={roleBadgeStyle('#eab308', '#000')}>D</span>}
                        {p.isSmallBlind && <span style={roleBadgeStyle('#3b82f6', '#fff')}>SB</span>}
                        {p.isBigBlind && <span style={roleBadgeStyle('#ef4444', '#fff')}>BB</span>}
                      </div>
                    )}
                    <div style={{
                      width: isMe ? '38px' : '30px',
                      height: isMe ? '38px' : '30px',
                      borderRadius: '50%',
                      margin: '0 auto 4px',
                      background: isMe 
                        ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                        : 'linear-gradient(135deg, #7c3aed, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMe ? '13px' : '11px',
                      fontWeight: 600,
                      color: '#fff',
                      opacity: p.status === 'folded' ? 0.4 : 1,
                    }}>
                      {p.username?.[0]?.toUpperCase()}
                    </div>
                    <p style={{
                      margin: '0 0 2px',
                      fontSize: isMe ? '12px' : '10px',
                      fontWeight: isMe ? 600 : 400,
                      color: '#cbd5e1'
                    }}>{p.username} {isMe && <span style={{ fontSize: '9px', color: '#60a5fa' }}>(You)</span>}</p>
                    <p style={{
                      margin: '0 0 6px',
                      fontSize: isMe ? '13px' : '11px',
                      fontWeight: 700,
                      color: '#fbbf24'
                    }}>
                      {p.chips?.toLocaleString()}
                    </p>

                    {/* Cards: your own face-up, opponents face-down */}
                    <div style={{ display: 'flex', gap: '3px', justifyContent: 'center' }}> 
                      {isMe ? (
                        myHoleCards.map((c, i) => <PlayingCard key={i} card={c} width={50} height={70} />)
                      ) : (
                        [0, 1].map(i => <PlayingCard key={i} card="" faceDown width={46} height={66} />)
                      )}
                    </div>

                    {p.status === 'folded' && <p style={{ margin: '4px 0 0', fontSize: '9px', color: '#ef4444' }}>Folded</p>}
                    {p.status === 'all-in' && <p style={{ margin: '4px 0 0', fontSize: '9px', color: '#f59e0b' }}>All-in</p>}
                  </div>
                </div>
              );
            })}

            {/* Community cards + pot go in the absolute center */}
            <div style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '10px' }}>
                {gameState?.communityCards?.map((card: string, i: number) => (
                  <PlayingCard key={card} card={card} width={62} height={86} dealDelay={i * 120} />
                ))}
              </div>
              <div style={{
                display: 'inline-block', padding: '4px 16px', borderRadius: '999px',
                background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)',
                fontSize: '13px', fontWeight: 600, color: '#fbbf24',
              }}>
                Pot: {gameState?.pot?.toLocaleString() ?? 0}
              </div>
            </div>
          </PokerTable>
        </div>

        {/* Right Side: Turn Timer & Action Panel (28% width) */}
        <div style={{
          width: '28%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '20px',
          zIndex: 10,
          boxSizing: 'border-box',
        }}>
          {isMyTurn ? (
            <>
              <TurnTimer
                secondsLeft={secondsLeft ?? 30}
                total={30}
              />
              <ActionPanel
                currentBet={gameState.currentBet}
                myChips={gameState.players.find((p: any) => p.id === user?.id)?.chips ?? 0}
                myBet={gameState.players.find((p: any) => p.id === user?.id)?.bet ?? 0}
                onAction={handleAction}
              />
            </>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '24px',
              padding: '24px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', fontWeight: 500 }}>
                Waiting for other players...
              </p>
            </div>
          )}
        </div>

      </div>

      {showdown && (
        <div style={{
          position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,0.95)', border: '2px solid #fbbf24',
          borderRadius: '16px', padding: '1.5rem 2.5rem', textAlign: 'center',
          boxShadow: '0 0 40px rgba(250,204,21,0.4)', zIndex: 50,
          animation: 'deal-in 0.4s ease-out',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#94a3b8' }}>Winner</p>
          <p style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 700, color: '#fbbf24' }}>
            {showdown.winnerUsername}
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#cbd5e1' }}>
            takes {showdown.pot.toLocaleString()} chips
          </p>
          {nextHandTimer !== null && (
            <div style={{
              fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}>
              <span style={{
                display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                background: '#fbbf24'
              }} />
              Next hand starts in {nextHandTimer}s
            </div>
          )}
        </div>
      )}

      {gameState?.phase === 'finished' && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
            border: '2px solid #fbbf24',
            borderRadius: '24px',
            padding: '3rem 4rem',
            textAlign: 'center',
            boxShadow: '0 0 50px rgba(250,204,21,0.25)',
            maxWidth: '500px',
            width: '90%',
          }}>
            <div style={{
              fontSize: '4rem',
              lineHeight: 1,
              marginBottom: '1rem',
            }}>
              🏆
            </div>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: '2rem',
              fontWeight: 800,
              background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Match Finished
            </h2>
            <p style={{
              margin: '0 0 24px',
              fontSize: '1.2rem',
              color: '#cbd5e1',
            }}>
              <strong>{finalWinner?.username || 'Unknown'}</strong> is the champion with <strong>{finalWinner?.chips?.toLocaleString()}</strong> chips!
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
            }}>
              {user?.id === gameState.hostId && (
                <button
                  onClick={handleRestartGame}
                  style={{
                    padding: '14px 28px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  Restart Match
                </button>
              )}
              
              <button
                onClick={() => {
                  socket.emit("leave_room", { roomId, userId: user!.id });
                  router.push('/lobby');
                }}
                style={{
                  padding: '14px 28px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#cbd5e1',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
