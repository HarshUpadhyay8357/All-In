import { Card } from "./deck";

export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'finished';
export type PlayerStatus = 'active' | 'folded' | 'all-in' | 'disconnected' | 'spectator';

export interface Player{
    id:number;
    username:string;
    holeCards: Card[];
    chips:number;
    bet:number; //bet in current round
    totalBetThisHand: number; // total bet uptil now
    status: PlayerStatus;
    seatNumber: number;
    isDealer: boolean;
    isSmallBlind:boolean;
    isBigBlind:boolean;
}

export interface SidePot{
    amount: number;
    eligible: number[]; // different player(s) eligible for this pot
}

export interface GameState{
    roomId:string;
    hostId:number;
    handNumber: number;
    phase:GamePhase;

    //deck and cards
    deck:Card[];
    communityCards:Card[];

    //players
    players:Player[];
    currentPlayerIndex:number; //whose turn it is

    //betting
    pot: number;
    sidePots:SidePot;
    currentBet: number; //bet amount to match 
    minRaise:number;

    //gameflow
    dealerIndex:number;
    smallBlindIndex:number;
    bigBlindIndex:number;
    lastActionTime:number;  // timestamp for timeout

    //history   
    actionHistory:Array<{
        playerId:number;
        action:'fold' | 'check' | 'call' | 'raise' | 'all-in';
        amount:number;
        timestamp:number;
        phase: GamePhase;
    }>;
}