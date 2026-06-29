import { Card } from "./deck";
import { Hand, type SolvedHand } from 'pokersolver';

export interface EvaluateHand{
    playerId:number;
    hand:SolvedHand;
    rank:number;
    description:string
}

export class handEvaluator {

    // evaluates a hand of 7 cards
    static evaluate(cards: Card[]): SolvedHand {
        if (cards.length !== 7) {
            throw new Error('A hand must have exactly 7 cards');
        }
        return Hand.solve(cards);
    }

    // compare multiple hands and return the winner(s)
    static findWinners(players: Array<{id:number; cards:Card[]}>): EvaluateHand[] {
        if(players.length===0) throw new Error('no players to evaluate');

        const evaluateHands=players.map(({id, cards}) => {
            const hand = this.evaluate(cards);
            return {
                playerId:id,
                hand,
                rank:hand.rank,
                description:hand.descr,
            };
        });

        //get the winning hands
        const handsForComparison = evaluateHands.map(h=>h.hand);
        const winnerHands = Hand.winners(handsForComparison);

        //return the player(s) with winning hand
        return evaluateHands.filter(h=>winnerHands.includes(h.hand));
    }

    //get hand name and description
    static getHandInfo(cards: Card[]): { rank: number; description: string } {
    const hand = this.evaluate(cards);
    return {
      rank: hand.rank,
      description: hand.descr,
    };
  }
}