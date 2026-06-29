"use client";
import { useAuthStore } from "@/lib/auth-store";
import { connectSocket, getSocket } from "../lib/socket";
import { useGameStore } from "../lib/game-store";
import { useEffect } from "react";

export function useSocket() {
  const socket = getSocket();
  const { user } = useAuthStore();
  const {
    setGameState,
    setMyHoleCards,
    setIsMyTurn,
    setPlayers,
    setSecondsLeft,
  } = useGameStore();

  useEffect(() => {
    connectSocket();
  }, [])
  

  useEffect(() => {
    //LISTEN TO SERVER EVENTS
    socket.on("room_joined", ({ seatNumber, players }) => {
      useGameStore.getState().setSeatNumber(seatNumber);
      setPlayers(players);
    });

    socket.on("room_updated", ({ players }) => {
      setPlayers(players);
    });

    socket.on("game_state_update", ({ gameState }) => {
      setGameState(gameState);

      //check if its the current user's turn
      if (user && gameState.players) {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        setIsMyTurn(currentPlayer?.id === user.id);
      }
    });

    socket.on("private_cards", ({ holeCards }) => {
      setMyHoleCards(holeCards);
    });

    socket.on("turn_tick", ({ secondsLeft }) => {
      setSecondsLeft(secondsLeft);
    });

    socket.on("error", ({ message }) => {
      console.error("Socket error: ", message);
      //toast(optional)
    });

    socket.on('game_over', ({ winnerId, winnerUsername, pot }) => {
  useGameStore.getState().setShowdown({ winnerId, winnerUsername, pot });
  setTimeout(() => useGameStore.getState().setShowdown(null), 4000);
});

    //CLEANUP
    return () => {
      socket.off("room_joined");
      socket.off("room_updated");
      socket.off("game_state_update");
      socket.off("private_cards");
      socket.off("turn_tick");
      socket.off("error");
    };
  }, [socket, user]);

  return socket;
}
