import { Card } from "@/types/poker";
import { create } from "zustand";

interface GameStore {
  gameState: any | null;
  myHoleCards: Card[];
  roomId: string | null;
  seatNumber: number | null;
  players: any[];
  secondsLeft: number;
  isMyTurn: boolean;
  showdown: { winnerId: number; winnerUsername: string; pot: number } | null;

  setGameState: (state: any) => void;
  setMyHoleCards: (cards: Card[]) => void;
  setRoomId: (id: string) => void;
  setSeatNumber: (seat: number) => void;
  setPlayers: (players: any[]) => void;
  setSecondsLeft: (seconds: number) => void;
  setIsMyTurn: (isMyTurn: boolean) => void;
  setShowdown: (s: any) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  myHoleCards: [],
  roomId: null,
  seatNumber: null,
  players: [],
  secondsLeft: 30,
  isMyTurn: false,
  showdown: null,
  
  setGameState: (gameState) => set({ gameState }),
  setMyHoleCards: (myHoleCards) => set({ myHoleCards }),
  setRoomId: (roomId) => set({ roomId }),
  setSeatNumber: (seatNumber) => set({ seatNumber }),
  setPlayers: (players) => set({ players }),
  setSecondsLeft: (secondsLeft) => set({ secondsLeft }),
  setIsMyTurn: (isMyTurn) => set({ isMyTurn }),
  setShowdown: (showdown) => set({ showdown }),
  reset: () =>
    set({
      gameState: null,
      myHoleCards: [],
      roomId: null,
      seatNumber: null,
      players: [],
      secondsLeft: 30,
      isMyTurn: false,
    }),
}));
