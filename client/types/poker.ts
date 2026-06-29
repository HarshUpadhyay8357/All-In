export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Suit = 'h' | 'd' | 'c' | 's';
export type Card = `${Rank}${Suit}`;

export const RoomStatus = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished',
} as const;

export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus];

export const GameResult = {
  WIN: 'win',
  LOSS: 'loss',
  FOLD: 'fold',
} as const;

export type GameResult = (typeof GameResult)[keyof typeof GameResult];