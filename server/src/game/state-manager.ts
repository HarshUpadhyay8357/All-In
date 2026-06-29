import { GamePhase, GameState, Player } from "./types";

export class GameStateManager {
  //initialize a new game state
  static initialize(roomId: string, players: Player[], hostId: number): GameState {
    const isHeadsUp = players.length === 2;
    const dealerIndex = 0;
    const smallBlindIndex = isHeadsUp ? 0 : 1 % players.length;
    const bigBlindIndex = isHeadsUp ? 1 : 2 % players.length;
    const currentPlayerIndex = isHeadsUp ? 0 : 3 % players.length;

    return {
      roomId,
      hostId,
      handNumber: 1,
      phase: "preflop",
      deck: [],
      communityCards: [],
      players: players.map((p, i) => ({
        ...p,
        holeCards: [],
        bet: 0,
        totalBetThisHand: 0,
        status: "active" as const,
        seatNumber: i,
        isDealer: i === dealerIndex,
        isSmallBlind: i === smallBlindIndex,
        isBigBlind: i === bigBlindIndex,
      })),
      currentPlayerIndex,
      pot: 0,
      sidePots: {
        amount: 0,
        eligible: [],
      },
      currentBet: 0,
      minRaise: 0,
      dealerIndex,
      smallBlindIndex,
      bigBlindIndex,
      lastActionTime: Date.now(),
      actionHistory: [],
    };
  }

  //get state for a particular player ( block the hole cards of other players)
  static getSanitizedState(state: GameState, playerId: number): GameState {
    return {
      ...state,
      players: state.players.map((p) => ({
        ...p,
        holeCards: p.id === playerId ? p.holeCards : (["??", "??"] as any),
      })),
    };
  }

  static getNextActiveSeatIndex(state: GameState, fromIndex: number): number {
    const numPlayers = state.players.length;
    let idx = fromIndex;
    for (let i = 0; i < numPlayers; i++) {
      idx = (idx + 1) % numPlayers;
      if (state.players[idx].status === "active") {
        return idx;
      }
    }
    return fromIndex;
  }

  //rotate dealer and blinds for next hand
  static rotateBlinds(state: GameState): void {
    const activePlayers = state.players.filter(
      (p) => p.status === "active",
    );

    if (activePlayers.length < 2) return; //game over

    state.dealerIndex = this.getNextActiveSeatIndex(state, state.dealerIndex);

    if (activePlayers.length === 2) {
      state.smallBlindIndex = state.dealerIndex;
      state.bigBlindIndex = this.getNextActiveSeatIndex(state, state.dealerIndex);
    } else {
      state.smallBlindIndex = this.getNextActiveSeatIndex(state, state.dealerIndex);
      state.bigBlindIndex = this.getNextActiveSeatIndex(state, state.smallBlindIndex);
    }

    //update player tags
    state.players.forEach((p, i) => {
      p.isDealer = i === state.dealerIndex;
      p.isSmallBlind = i === state.smallBlindIndex;
      p.isBigBlind = i === state.bigBlindIndex;
    });
  }

  //reset state for next hand
  static resetForNextHand(state: GameState): void {
    state.handNumber++;
    state.phase = "preflop";
    state.deck = [];
    state.communityCards = [];
    state.pot = 0;
    state.sidePots = {
      amount: 0,
      eligible: [],
    };
    state.currentBet = 0;
    state.minRaise = 0;
    state.actionHistory = [];
    state.players.forEach((p) => {
      p.holeCards = [];
      p.bet = 0;
      p.totalBetThisHand = 0;
      if (p.status !== "disconnected") {
        if (p.chips <= 0) {
          p.status = "spectator";
        } else {
          p.status = "active";
        }
      }
    });
    this.rotateBlinds(state);
  }

  //next active player to act
  static getNextActivePlayerIndex(state: GameState, formIndex: number): number {
    let index = formIndex;
    const numPlayers = state.players.length;

    for (let i = 0; i < numPlayers; i++) {
      index = (index + 1) % numPlayers;
      const player = state.players[index];
      if (player.status === "active" && player.chips > 0) return index;
    }
    return -1; // no active players
  }

  //check if betting round is complete (i.e. if all active players have acted and matched the current bet)
  static isBettingComplete(state: GameState): Boolean {
    const activePlayers = state.players.filter(
      (p) => p.status === "active" || p.status === "all-in",
    );
    if (activePlayers.length <= 1) return true; //only one player left

    return activePlayers.every((p) => {
      if (p.status === "all-in") return true;

      // Find the player's last action in the current phase
      const phaseActions = state.actionHistory.filter(
        (a) => a.playerId === p.id && a.phase === state.phase
      );

      if (phaseActions.length === 0) {
        // Player has not acted in this phase yet
        return false;
      }

      const lastAction = phaseActions[phaseActions.length - 1];
      
      // If player checked, they are complete only if the current outstanding bet is 0
      if (lastAction.action === "check") {
        return state.currentBet === 0;
      }

      // Otherwise, they are complete if their current bet matches the table's current bet
      return p.bet === state.currentBet;
    });
  }

  //advance to next betting round or showdown
  static advancePhase(state: GameState): void {
    const phases: GamePhase[] = [
      "preflop",
      "flop",
      "turn",
      "river",
      "showdown",
    ];
    const currentIndex = phases.indexOf(state.phase);

    if (currentIndex < phases.length - 1) {
      state.phase = phases[currentIndex + 1];

      //reset betting for next round
      if (state.phase !== "showdown") {
        state.currentBet = 0;
        state.minRaise = 0;
        state.players.forEach((p) => {
          if (p.status !== "folded") {
            p.bet = 0;
          }
        });
      }
    }
  }
}
