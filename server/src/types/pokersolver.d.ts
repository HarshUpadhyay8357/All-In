declare module 'pokersolver' {
  export interface SolvedHand {
    cardPool: string[];
    cards: string[];
    descr: string;
    name: string;
    rank: number;
    toString(): string;
  }

  export class Hand {
    static solve(cards: string[], game?: string, canDisqualify?: boolean): SolvedHand;
    static winners(hands: SolvedHand[]): SolvedHand[];
    static toString(): string;
  }

  export class Card {
    [key: string]: any;
  }

  export class Game {
    [key: string]: any;
  }

  export class RoyalFlush {
    [key: string]: any;
  }

  export class NaturalRoyalFlush {
    [key: string]: any;
  }

  export class WildRoyalFlush {
    [key: string]: any;
  }

  export class FiveOfAKind {
    [key: string]: any;
  }

  export class StraightFlush {
    [key: string]: any;
  }

  export class FourOfAKindPairPlus {
    [key: string]: any;
  }

  export class FourOfAKind {
    [key: string]: any;
  }

  export class FourWilds {
    [key: string]: any;
  }

  export class TwoThreeOfAKind {
    [key: string]: any;
  }

  export class ThreeOfAKindTwoPair {
    [key: string]: any;
  }

  export class FullHouse {
    [key: string]: any;
  }

  export class Flush {
    [key: string]: any;
  }

  export class Straight {
    [key: string]: any;
  }

  export class ThreeOfAKind {
    [key: string]: any;
  }

  export class ThreePair {
    [key: string]: any;
  }

  export class TwoPair {
    [key: string]: any;
  }

  export class OnePair {
    [key: string]: any;
  }

  export class HighCard {
    [key: string]: any;
  }

  export class PaiGowPokerHelper {
    baseHand: SolvedHand;
    hiHand: SolvedHand;
    loHand: SolvedHand;
    solve(cards: string[]): void;
    setHands(hiHand: string[], loHand: string[]): void;
    static winners(player: PaiGowPokerHelper, banker: PaiGowPokerHelper): number;
  }
}
