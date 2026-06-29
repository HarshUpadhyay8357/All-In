export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A'  ;
export type Suit = 'h' | 'd' | 'c' | 's';
export type Card = `${Rank}${Suit}`;

export class Deck{
    public cards: Card[];

    constructor(){
        const ranks:Rank[]=['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const suits:Suit[]=['h', 'd', 'c', 's'];
        this.cards=[];

        for (const rank of ranks) {
            for (const suit of suits) {
                this.cards.push(`${rank}${suit}` as Card);
            }
        }
        this.shuffle();
    }

    //fisher-yates shuffle
    private shuffle():void{
        for(let i=this.cards.length-1; i>0; i--){
            const j=Math.floor(Math.random()*(i+1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    //draw one card
    draw():Card{
        const card=this.cards.pop();
        if(!card) throw new Error('deck is empty');
        return card;
    }

    //draw multiple cards
    drawMultiple(count: number):Card[]{
        return Array.from({length:count}, ()=>this.draw());
    }

    //number of remaining cards
    remaining():number{
        return this.cards.length;
    }

    //reset the deck
    reset():void{
        const ranks:Rank[]=['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
        const suits:Suit[]=['h', 'd', 'c', 's'];
        this.cards=[];

        for (const rank of ranks) {
            for (const suit of suits) {
                this.cards.push(`${rank}${suit}` as Card);
            }
        }
        this.shuffle();
    }
}