import { SidePotCalculator } from "../side-pot";
import { GameState, Player } from "../types";
import { GameFlowManager } from "../game-flow";
import { Card } from "../deck";

describe('SidePotCalculator', ()=>{

    it('should handle simple all-in scenario', ()=>{
        const state:Partial<GameState>={
            players: [
                {id:1, totalBetThisHand:100, status:'active'} as Player,
                {id:2, totalBetThisHand:500, status:'active'} as Player,
            ] as Player[],
        };

        const sidePots =  SidePotCalculator.calculate(state as GameState); 

        expect(sidePots).toHaveLength(2);
        expect(sidePots[0].amount).toBe(200);
        expect(sidePots[1].amount).toBe(400);
    });

    it('should handle multiple all-ins', ()=>{
        const state:Partial<GameState>={
            players: [
                {id:1, totalBetThisHand:50, status:'all-in'} as Player,
                {id:2, totalBetThisHand:200, status:'all-in'} as Player,
                {id:3, totalBetThisHand:500, status:'active'} as Player,
            ] as Player[],
        };

        const sidePots =  SidePotCalculator.calculate(state as GameState);

        expect(sidePots).toHaveLength(3);
        expect(sidePots[0].amount).toBe(150);
        expect(sidePots[1].amount).toBe(300);
        expect(sidePots[2].amount).toBe(300);
    });

    it('should exclude folded players from pots', ()=>{
        const state:Partial<GameState>={
            players: [
                {id:1, totalBetThisHand:100, status:'active'} as Player,
                {id:2, totalBetThisHand:100, status:'folded'} as Player,
                {id:3, totalBetThisHand:100, status:'active'} as Player,
            ] as Player[],
        };

        const sidePots =  SidePotCalculator.calculate(state as GameState);

        expect(sidePots[0].eligible).toEqual([1,3]);
    });

    it('should include folded players\' chip contributions in side pots and not lose them', () => {
        const state: Partial<GameState> = {
            players: [
                { id: 1, totalBetThisHand: 100, status: 'active' } as Player,
                { id: 2, totalBetThisHand: 50, status: 'folded' } as Player,
                { id: 3, totalBetThisHand: 100, status: 'active' } as Player,
            ] as Player[],
        };

        const sidePots = SidePotCalculator.calculate(state as GameState);

        // Level 50: Player 1 (50) + Player 2 (50) + Player 3 (50) = 150
        // Level 100: Player 1 (50) + Player 3 (50) = 100
        expect(sidePots).toHaveLength(2);
        expect(sidePots[0].amount).toBe(150);
        expect(sidePots[0].eligible).toEqual([1, 3]);
        expect(sidePots[1].amount).toBe(100);
        expect(sidePots[1].eligible).toEqual([1, 3]);
    });

    it('should automatically run out the board to showdown when all players are all-in', () => {
        const state: Partial<GameState> = {
            phase: 'preflop',
            deck: ['Ah', 'Kh', 'Qh', 'Jh', 'Th'] as unknown as Card[],
            communityCards: [] as Card[],
            players: [
                { id: 1, status: 'all-in', chips: 0, bet: 100, totalBetThisHand: 100 } as Player,
                { id: 2, status: 'all-in', chips: 0, bet: 100, totalBetThisHand: 100 } as Player,
            ] as Player[],
        };

        GameFlowManager.advanceToNextRound(state as GameState);

        expect(state.phase).toBe('showdown');
        expect(state.communityCards).toHaveLength(5); // flop (3) + turn (1) + river (1)
    });
});