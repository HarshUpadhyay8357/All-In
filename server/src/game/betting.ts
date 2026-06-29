import { GameState } from "./types";

export class bettingEngine {
    
  //player calls current bet
  static call(state: GameState, playerId: number): void {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("player not found");

    const callAmount = Math.min(state.currentBet - player.bet, player.chips);
    player.chips -= callAmount;
    player.bet += callAmount;
    player.totalBetThisHand += callAmount;
    state.pot += callAmount;

    if (player.chips == 0) player.status = "all-in";

    this.logAction(state, playerId, "call", callAmount);
  }

  //player raises
  static raise(state: GameState, playerId: number, raiseAmount: number): void {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("player not found");

    const maxTotalBet = player.bet + player.chips;
    const targetTotalBet = Math.min(raiseAmount, maxTotalBet);
    const amountToAdd = targetTotalBet - player.bet;

    if (amountToAdd < 0) {
      throw new Error("Cannot raise to an amount less than your current bet");
    }

    player.chips -= amountToAdd;
    player.bet += amountToAdd;
    player.totalBetThisHand += amountToAdd;
    state.pot += amountToAdd;
    
    const oldCurrentBet = state.currentBet;
    state.currentBet = player.bet;
    state.minRaise = state.currentBet - oldCurrentBet;

    if (player.chips === 0) player.status = "all-in";

    this.logAction(state, playerId, "raise", targetTotalBet);
  }

  //player folds
  static fold(state: GameState, playerId: number): void {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("player not found");

    player.status = "folded";
    this.logAction(state, playerId, "fold", 0);
  }

  //checks
  static check(state: GameState, playerId: number): void {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("player not found");

    if (player.bet !== state.currentBet)
      throw new Error(`can't check when there is an outstanding bet`);
    this.logAction(state, playerId, "check", 0);
  }

  //blind bets(small blinds and big blinds)
  static postBlind(
    state: GameState,
    playerId: number,
    blindAmount: number,
  ): void {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("player not found");

    const amount = Math.min(blindAmount, player.chips);
    player.chips -= amount;
    player.bet += amount;
    player.totalBetThisHand += amount;
    state.pot += amount;
    state.currentBet = Math.max(state.currentBet, player.bet);

    if (player.chips === 0) {
      player.status = "all-in";
    }
  }

  //count active players(not folded)
  static countActivePlayers(state: GameState): number {
    return state.players.filter((p) => p.status !== "folded").length;
  }

  //log action to the history
  private static logAction(
    state: GameState,
    playerId: number,
    action: "fold" | "check" | "call" | "raise" | "all-in",
    amount: number,
  ): void {
    state.actionHistory.push({
      playerId,
      action,
      amount,
      timestamp: Date.now(),
      phase: state.phase,
    });
  }
}
