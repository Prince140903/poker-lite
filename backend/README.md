# 🎮 Poker Lite Backend

A round-based, real-time, multiplayer card game server built with Node.js, Express, and Socket.IO.

## 📋 Overview

This is a **points-based casual card game** inspired by Poker with simplified rules. It's NOT a casino game.

### Key Features
- ✅ Private rooms with unique codes
- ✅ 2-8 players per room
- ✅ Round-based gameplay with multiple rounds
- ✅ Turn-based betting system
- ✅ Real-time updates via Socket.IO
- ✅ Server-authoritative (prevents cheating)
- ✅ In-memory storage (no database)
- ✅ Spectator mode for eliminated players

## 🎴 Game Rules

### Card System
- **Deck**: Standard 52-card deck
- **Cards per player**: 2 cards
- **Unique cards**: No duplication across players

### Card Values (Suits are IGNORED)
- `2-10` → Face value
- `J` → 11
- `Q` → 12
- `K` → 13
- `A` → 14

### Hand Value
- **Hand strength** = Highest card value among your 2 cards
- **NO** pairs, straights, or flushes
- Simple highest-card-wins logic

### Points & Elimination
- All players start with **1000 points**
- Players with **0 points** are eliminated
- Eliminated players become spectators
- Can't receive cards or place bets when eliminated

### Round System
- Game consists of multiple rounds
- Each round:
  1. Reset player states
  2. Shuffle deck
  3. Deal 2 cards per active player
  4. Betting phase
  5. Showdown or winner determination
  
### Stake Rules
- **Initial stake**: Configurable (default: 100)
- **Stake doubling**: Every 5 rounds, stake × 2
- Applies globally to all players

### Betting Actions
- **Bet**: Place initial bet (must be ≥ current stake)
- **Call**: Match the current highest bet
- **Raise**: Increase the current bet
- **Fold**: Give up the round (lose stake)
- **All-in**: Bet all remaining points

### Win Conditions
1. **Last player standing**: All others folded → Winner takes pot
2. **Showdown**: Compare hand values
   - Highest value wins
   - Ties split the pot equally

### Game End
- Game ends when only **1 non-eliminated player** remains
- That player is the overall winner

## 🏗️ Project Structure

```
Poker-lite/
├── server.js                      # Main entry point
├── package.json                   # Dependencies
├── handlers/
│   └── socketHandlers.js          # Socket.IO event handlers
└── utils/
    ├── deckHandler.js             # Card deck management
    ├── roomManager.js             # Room & player management
    ├── gameStateManager.js        # Game logic & rounds
    └── turnManager.js             # Turn & betting validation
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Start the server**
```bash
npm start
```

3. **Development mode (with auto-restart)**
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

### Environment Variables
You can set a custom port:
```bash
PORT=4000 npm start
```

## 📡 Socket.IO Events

### Client → Server

#### `CREATE_ROOM`
Create a new game room
```javascript
socket.emit('CREATE_ROOM', {
  playerName: 'John',
  initialStake: 100
}, (response) => {
  // response.roomCode, response.room
});
```

#### `JOIN_ROOM`
Join an existing room
```javascript
socket.emit('JOIN_ROOM', {
  roomCode: 'ABC123',
  playerName: 'Jane'
}, (response) => {
  // response.playerId, response.room
});
```

#### `LEAVE_ROOM`
Leave current room
```javascript
socket.emit('LEAVE_ROOM', {}, (response) => {
  // response.success
});
```

#### `START_GAME`
Start the game (host only)
```javascript
socket.emit('START_GAME', {}, (response) => {
  // response.success
});
```

#### `PLAYER_ACTION`
Perform betting action
```javascript
socket.emit('PLAYER_ACTION', {
  action: 'bet', // 'bet', 'call', 'raise', 'fold', 'all-in'
  amount: 150    // required for 'bet' and 'raise'
}, (response) => {
  // response.success, response.result
});
```

#### `REQUEST_SHOWDOWN`
Trigger showdown when betting is complete
```javascript
socket.emit('REQUEST_SHOWDOWN', {}, (response) => {
  // response.success
});
```

#### `START_NEW_ROUND`
Start next round (host only)
```javascript
socket.emit('START_NEW_ROUND', {}, (response) => {
  // response.success
});
```

#### `GET_GAME_STATE`
Request current game state
```javascript
socket.emit('GET_GAME_STATE', {}, (response) => {
  // response.state
});
```

### Server → Client

#### `ROOM_UPDATED`
Room state changed
```javascript
socket.on('ROOM_UPDATED', (data) => {
  // data.room
});
```

#### `PLAYER_JOINED`
New player joined
```javascript
socket.on('PLAYER_JOINED', (data) => {
  // data.player, data.room
});
```

#### `PLAYER_LEFT`
Player left room
```javascript
socket.on('PLAYER_LEFT', (data) => {
  // data.playerId, data.playerName, data.room
});
```

#### `PLAYER_DISCONNECTED`
Player disconnected
```javascript
socket.on('PLAYER_DISCONNECTED', (data) => {
  // data.playerId, data.playerName, data.room
});
```

#### `GAME_STARTED`
Game has started
```javascript
socket.on('GAME_STARTED', (data) => {
  // data.roundNumber, data.currentStake, data.pot
});
```

#### `DEAL_CARDS`
Your cards for the round (private)
```javascript
socket.on('DEAL_CARDS', (data) => {
  // data.cards: [{ suit, rank, value }, ...]
});
```

#### `PLAYER_ACTION_RESULT`
Player performed an action
```javascript
socket.on('PLAYER_ACTION_RESULT', (data) => {
  // data.playerId, data.playerName, data.action, data.amount, data.pot
});
```

#### `GAME_STATE_UPDATE`
Current game state
```javascript
socket.on('GAME_STATE_UPDATE', (data) => {
  // data: { roomCode, gameStarted, roundNumber, currentStake, pot, players, ... }
});
```

#### `SHOWDOWN`
Round ended with showdown
```javascript
socket.on('SHOWDOWN', (data) => {
  // data.winners, data.pot, data.reason, data.playersState
});
```

#### `ROUND_START`
New round started
```javascript
socket.on('ROUND_START', (data) => {
  // data.roundNumber, data.currentStake, data.pot
});
```

#### `GAME_END`
Game has ended
```javascript
socket.on('GAME_END', (data) => {
  // data.winner, data.finalStandings
});
```

## 🎯 Player State Structure

Each player has the following state:
```javascript
{
  id: 'unique_id',
  name: 'PlayerName',
  socketId: 'socket_id',
  points: 1000,
  cards: [],
  currentBet: 0,
  hasFolded: false,
  isAllIn: false,
  isEliminated: false,
  isSpectator: false,
  isHost: false
}
```

## 🧪 Testing the Server

### Health Check
```bash
curl http://localhost:3001/health
```

### API Info
```bash
curl http://localhost:3001/
```

### Example Client Connection (JavaScript)
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected!');
  
  // Create a room
  socket.emit('CREATE_ROOM', {
    playerName: 'TestPlayer',
    initialStake: 100
  }, (response) => {
    console.log('Room created:', response.roomCode);
  });
});
```

## 🔒 Security Features

- **Server-authoritative**: All game logic runs server-side
- **Turn validation**: Only current player can act
- **Action validation**: Invalid actions are rejected
- **Card privacy**: Players only see their own cards
- **Cheat prevention**: No client-side card manipulation

## 🐛 Error Handling

All socket events return standardized error responses:
```javascript
{
  error: 'Error message description'
}
```

Success responses include:
```javascript
{
  success: true,
  // ...additional data
}
```

## 📝 Development Notes

### In-Memory Storage
- All data stored in memory (Map objects)
- Data is lost on server restart
- Suitable for v1 prototype
- Can be extended with database in future

### Code Organization
- **Modular architecture**: Separate concerns
- **Clean interfaces**: Each module has clear responsibilities
- **Commented code**: Game logic is well-documented
- **No frontend logic**: Backend only

## 🎮 Game Flow Example

1. Host creates room → receives room code
2. Players join using room code
3. Host starts game (min 2 players)
4. Server deals 2 cards to each player
5. Turn-based betting begins
6. Players bet/call/raise/fold/all-in
7. Round ends:
   - Last player standing, OR
   - Showdown (compare hands)
8. Winner(s) receive pot
9. Host starts new round
10. Repeat until 1 player remains

## 🚧 Future Enhancements (Not in v1)

- Database persistence
- Player authentication
- Replay/hand history
- Spectator chat
- Room settings customization
- Tournament mode

## 📄 License

MIT

## 👨‍💻 Author

Created following exact specification requirements.

---

**Ready to connect with a React client!** 🎉
