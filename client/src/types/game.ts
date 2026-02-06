export interface Card {
  suit: string;
  rank: string;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  socketId?: string;
  points: number;
  currentBet: number;
  hasFolded: boolean;
  isAllIn: boolean;
  isEliminated: boolean;
  isSpectator: boolean;
  isHost: boolean;
  hasCards: boolean;
  cards?: Card[];
}

export interface GameState {
  roomCode: string;
  gameStarted: boolean;
  gameEnded: boolean;
  roundNumber: number;
  currentStake: number;
  pot: number;
  highestBet: number;
  currentTurn: string | null;
  currentTurnSocketId: string | null;
  players: Player[];
}

export interface ShowdownWinner {
  id: string;
  name: string;
  winAmount: number;
  hand: Card[];
  handValue: number;
}

export interface ShowdownData {
  roundNumber: number;
  winners: ShowdownWinner[];
  pot: number;
  reason: string;
  playersState: Array<{
    id: string;
    name: string;
    points: number;
    isEliminated: boolean;
  }>;
  gameEnded?: boolean;
  gameWinner?: Player | null;
}

export interface GameEndData {
  gameEnded: boolean;
  winner: Player | null;
  finalStandings: Array<{
    id: string;
    name: string;
    points: number;
    isEliminated: boolean;
  }>;
}
