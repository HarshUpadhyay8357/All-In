import { Card } from "../deck";
import { handEvaluator } from "../hand-evaluator";

describe('HandEvaluator', () => {
    it('should evaluate a pair', () => {
        const cards: Card[] = ['As', 'Ah', '2d', '3c', '4h', '8s', 'Qd'];
        const hand = handEvaluator.evaluate(cards);
        expect(hand.descr.toLowerCase()).toContain('pair');
    });

    it('should find a single winner', () => {
        const players = [
            { id: 1, cards: ['As', 'Ks', 'Qs', 'Js', 'Ts', '2h', '3d'] as Card[] }, // Royal flush
            { id: 2, cards: ['9s', '9h', '2d', '3c', '4h', '5s', '6d'] as Card[] }, // Pair
        ];
        const winners = handEvaluator.findWinners(players);
        expect(winners.length).toBe(1);
        expect(winners[0].playerId).toBe(1);
    });

    it('should handle a split pot (tie)', () => {
        const players = [
            { id: 1, cards: ['As', 'Ks', 'Qs', 'Js', 'Ts', '2h', '3d'] as Card[] }, // Royal flush (spades)
            { id: 2, cards: ['Ah', 'Kh', 'Qh', 'Jh', 'Th', '2c', '3d'] as Card[] }, // Royal flush (hearts)
        ];
        const winners = handEvaluator.findWinners(players);
        expect(winners.length).toBe(2); // Both win in a split
    });
});