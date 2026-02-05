/**
 * Game Constants
 * Centralized configuration values
 */

module.exports = {
  // Room settings
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 8,
  
  // Game settings
  DEFAULT_STARTING_POINTS: 1000,
  DEFAULT_INITIAL_STAKE: 100,
  STAKE_MULTIPLIER_ROUNDS: 5,  // Stake doubles every 5 rounds
  STAKE_MULTIPLIER: 2,
  
  // Card values
  CARD_VALUES: {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14
  },
  
  // Actions
  ACTIONS: {
    BET: 'bet',
    CALL: 'call',
    RAISE: 'raise',
    FOLD: 'fold',
    ALL_IN: 'all-in'
  },
  
  // Socket events
  EVENTS: {
    // Client to Server
    CREATE_ROOM: 'CREATE_ROOM',
    JOIN_ROOM: 'JOIN_ROOM',
    LEAVE_ROOM: 'LEAVE_ROOM',
    START_GAME: 'START_GAME',
    PLAYER_ACTION: 'PLAYER_ACTION',
    REQUEST_SHOWDOWN: 'REQUEST_SHOWDOWN',
    START_NEW_ROUND: 'START_NEW_ROUND',
    GET_GAME_STATE: 'GET_GAME_STATE',
    
    // Server to Client
    ROOM_UPDATED: 'ROOM_UPDATED',
    PLAYER_JOINED: 'PLAYER_JOINED',
    PLAYER_LEFT: 'PLAYER_LEFT',
    PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
    GAME_STARTED: 'GAME_STARTED',
    DEAL_CARDS: 'DEAL_CARDS',
    PLAYER_ACTION_RESULT: 'PLAYER_ACTION_RESULT',
    GAME_STATE_UPDATE: 'GAME_STATE_UPDATE',
    SHOWDOWN: 'SHOWDOWN',
    ROUND_START: 'ROUND_START',
    GAME_END: 'GAME_END'
  }
};
