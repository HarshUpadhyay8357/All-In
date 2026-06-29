import { GameState, SidePot } from "./types";


export class SidePotCalculator{

    //calculate side-pots
    static calculate(state:GameState):SidePot[]{
        // Get all unique total bets this hand > 0, from all players (both active and folded)
        const levels = Array.from(
            new Set(state.players.map(p => p.totalBetThisHand).filter(b => b > 0))
        ).sort((a, b) => a - b);

        if (levels.length === 0) return [];

        const sidePots: SidePot[] = [];
        let prevAmount = 0;

        for (let i = 0; i < levels.length; i++) {
            const currAmount = levels[i];
            const diff = currAmount - prevAmount;

            if (diff <= 0) continue;

            // Calculate the pot amount contributed to this level by ALL players
            const potAmount = state.players.reduce((sum, p) => {
                const contrib = Math.min(p.totalBetThisHand, currAmount) - Math.min(p.totalBetThisHand, prevAmount);
                return sum + contrib;
            }, 0);

            // Active/eligible players who reached at least this level
            let eligibleIds = state.players
                .filter(p => p.status !== 'folded' && p.status !== 'disconnected' && p.status !== 'spectator' && p.totalBetThisHand >= currAmount)
                .map(p => p.id);

            if (potAmount > 0) {
                // If no active players are eligible for this level (e.g. only folded players bet this high),
                // award it to the active players who bet the most (standard dead-money rule).
                if (eligibleIds.length === 0) {
                    const activePlayers = state.players.filter(p => p.status !== 'folded' && p.status !== 'disconnected' && p.status !== 'spectator');
                    if (activePlayers.length > 0) {
                        const maxActiveBet = Math.max(...activePlayers.map(p => p.totalBetThisHand));
                        eligibleIds = activePlayers.filter(p => p.totalBetThisHand === maxActiveBet).map(p => p.id);
                    }
                }

                if (eligibleIds.length > 0) {
                    sidePots.push({
                        amount: potAmount,
                        eligible: eligibleIds,
                    });
                }
            }
            prevAmount = currAmount;
        }

        return sidePots;
    }

    //award sidepots to winners
    //called at showdown with winner from hand evaluator
    static awardPots(state:GameState, sidepots:SidePot[], winnersByPot: number[][]): void{    //winnersByPot-->array of winner arrays for each pot
        
        sidepots.forEach((pot, potIndex)=>{
            const winners=winnersByPot[potIndex] || [];

            if(winners.length===0)  //if not winners(shoudn't happen), split the pot among eligible players
                winners.push(...pot.eligible);

            const awardPerWinner=Math.floor(pot.amount/winners.length);
            const remainder=pot.amount%winners.length;

            winners.forEach((winnerId, index)=>{
                const player=state.players.find(p=>p.id===winnerId);
                if(player){
                    player.chips+=awardPerWinner;
                    if(index<remainder) player.chips+=1;
                }
            });
        });
    }
}