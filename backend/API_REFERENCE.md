# 🎴 Socket.IO Event Reference Card

Quick reference for all Socket.IO events in the Poker Lite backend.

---

## 📤 CLIENT → SERVER EVENTS

### 🏠 Room Management

#### `CREATE_ROOM`
**Purpose**: Create a new game room  
**Payload**:
```javascript
{
  playerName: string,      // Required
  initialStake: number     // Optional, default: 100
}
```
**Response**:
```javascript
{
  success: true,
  roomCode: string,        // Share this code with friends
  room: { ... }
}
```

---

#### `JOIN_ROOM`
**Purpose**: Join an existing room  
**Payload**:
```javascript
{
  roomCode: string,        // Required - 6 characters
  playerName: string       // Required
}
```
**Response**:
```javascript
{
  success: true,
  roomCode: string,
  playerId: string,
  room: { ... }
}
```

---

#### `LEAVE_ROOM`
**Purpose**: Leave current room  
**Payload**: `{}`  
**Response**:
```javascript
{
  success: true
}
```

---

### 🎮 Game Control

#### `START_GAME`
**Purpose**: Start the game (host only)  
**Requires**: 2-8 players, game not started  
**Payload**: `{}`  
**Response**:
```javascript
{
  success: true
}
```

---

#### `START_NEW_ROUND`
**Purpose**: Begin next round after current ends (host only)  
**Payload**: `{}`  
**Response**:
```javascript
{
  success: true
}
```

---

### 💰 Gameplay Actions

#### `PLAYER_ACTION`
**Purpose**: Perform betting action (on your turn only)  
**Payload**:
```javascript
{
  action: 'bet' | 'call' | 'raise' | 'fold' | 'all-in',
  amount: number           // Required for 'bet' and 'raise'
}
```
**Response**:
```javascript
{
  success: true,
  result: { ... }
}
```

**Actions Explained**:
- **bet**: Place initial bet (must be ≥ stake)
- **call**: Match the current highest bet
- **raise**: Increase the bet (must be > current highest)
- **fold**: Give up (lose stake to pot)
- **all-in**: Bet all remaining points

---

#### `REQUEST_SHOWDOWN`
**Purpose**: End round and reveal winner(s)  
**Requires**: Betting must be complete  
**Payload**: `{}`  
**Response**:
```javascript
{
  success: true
}
```

---

### 🔍 Information

#### `GET_GAME_STATE`
**Purpose**: Request current game state  
**Payload**: `{}`  
**Response**:
```javascript
{
  success: true,
  state: {
    roomCode: string,
    gameStarted: boolean,
    gameEnded: boolean,
    roundNumber: number,
    currentStake: number,
    pot: number,
    highestBet: number,
    currentTurn: string,         // Player name
    currentTurnSocketId: string,
    players: [...],
    myCards: [...]               // Your cards if dealt
  }
}
```

---

## 📥 SERVER → CLIENT EVENTS

### 🏠 Room Updates

#### `ROOM_UPDATED`
**When**: Room state changes  
**Payload**:
```javascript
{
  room: {
    code: string,
    players: [...],
    gameStarted: boolean
  }
}
```

---

#### `PLAYER_JOINED`
**When**: New player joins room  
**Payload**:
```javascript
{
  player: {
    id: string,
    name: string
  },
  room: { ... }
}
```

---

#### `PLAYER_LEFT`
**When**: Player leaves room  
**Payload**:
```javascript
{
  playerId: string,
  playerName: string,
  room: { ... }
}
```

---

#### `PLAYER_DISCONNECTED`
**When**: Player disconnects unexpectedly  
**Payload**:
```javascript
{
  playerId: string,
  playerName: string,
  room: { ... }
}
```

---

### 🎮 Game Events

#### `GAME_STARTED`
**When**: Game begins  
**Payload**:
```javascript
{
  roundNumber: number,
  currentStake: number,
  pot: number
}
```

---

#### `ROUND_START`
**When**: New round begins  
**Payload**:
```javascript
{
  roundNumber: number,
  currentStake: number,
  pot: number
}
```

---

#### `DEAL_CARDS`
**When**: Cards dealt (PRIVATE - only you see your cards)  
**Payload**:
```javascript
{
  cards: [
    {
      suit: string,      // 'hearts', 'diamonds', 'clubs', 'spades'
      rank: string,      // '2'-'10', 'J', 'Q', 'K', 'A'
      value: number      // 2-14
    },
    // 2 cards total
  ]
}
```

---

#### `PLAYER_ACTION_RESULT`
**When**: Player performs action  
**Payload**:
```javascript
{
  playerId: string,
  playerName: string,
  action: string,        // 'bet', 'call', 'raise', 'fold', 'all-in'
  amount: number,        // If applicable
  pot: number,
  currentTurnIndex: number
}
```

---

#### `GAME_STATE_UPDATE`
**When**: Game state changes  
**Payload**:
```javascript
{
  roomCode: string,
  gameStarted: boolean,
  gameEnded: boolean,
  roundNumber: number,
  currentStake: number,
  pot: number,
  highestBet: number,
  currentTurn: string,
  currentTurnSocketId: string,
  players: [
    {
      id: string,
      name: string,
      points: number,
      currentBet: number,
      hasFolded: boolean,
      isAllIn: boolean,
      isEliminated: boolean,
      isSpectator: boolean,
      isHost: boolean,
      hasCards: boolean    // true if player has cards
    }
  ]
}
```

---

#### `SHOWDOWN`
**When**: Round ends with showdown  
**Payload**:
```javascript
{
  roundNumber: number,
  winners: [
    {
      id: string,
      name: string,
      winAmount: number,
      hand: [...],           // 2 cards
      handValue: number      // Highest card value
    }
  ],
  pot: number,
  reason: string,            // 'Showdown' or 'All others folded'
  playersState: [...]        // All players' current state
}
```

---

#### `GAME_END`
**When**: Game completely ends (1 player remains)  
**Payload**:
```javascript
{
  winner: {
    id: string,
    name: string,
    points: number
  } | null,
  finalStandings: [
    {
      id: string,
      name: string,
      points: number,
      isEliminated: boolean
    }
  ]
}
```

---

## 🎯 Quick Action Examples

### Creating and Joining Flow
```javascript
// HOST
socket.emit('CREATE_ROOM', {
  playerName: 'Alice',
  initialStake: 100
}, (res) => {
  const roomCode = res.roomCode; // Share with friends
});

// PLAYER 2
socket.emit('JOIN_ROOM', {
  roomCode: 'ABC123',
  playerName: 'Bob'
}, (res) => {
  console.log('Joined!');
});

// HOST starts game
socket.emit('START_GAME', {}, (res) => {
  console.log('Game on!');
});
```

---

### Betting Flow
```javascript
// Listen for your turn
socket.on('GAME_STATE_UPDATE', (state) => {
  if (state.currentTurnSocketId === socket.id) {
    // It's your turn!
    
    // Option 1: Bet
    socket.emit('PLAYER_ACTION', {
      action: 'bet',
      amount: 150
    });
    
    // Option 2: Call
    socket.emit('PLAYER_ACTION', {
      action: 'call'
    });
    
    // Option 3: Raise
    socket.emit('PLAYER_ACTION', {
      action: 'raise',
      amount: 200
    });
    
    // Option 4: Fold
    socket.emit('PLAYER_ACTION', {
      action: 'fold'
    });
    
    // Option 5: All-in
    socket.emit('PLAYER_ACTION', {
      action: 'all-in'
    });
  }
});
```

---

### Listening for Cards
```javascript
socket.on('DEAL_CARDS', (data) => {
  console.log('My cards:');
  data.cards.forEach(card => {
    console.log(`${card.rank} of ${card.suit}`);
  });
});
```

---

### Handling Showdown
```javascript
socket.on('SHOWDOWN', (data) => {
  console.log(`Round ${data.roundNumber} ended!`);
  console.log(`Pot: ${data.pot}`);
  
  data.winners.forEach(winner => {
    console.log(`${winner.name} won ${winner.winAmount}!`);
    console.log(`Hand value: ${winner.handValue}`);
  });
});
```

---

### Starting Next Round
```javascript
socket.on('SHOWDOWN', (data) => {
  if (!data.gameEnded) {
    // Game continues, host can start next round
    if (isHost) {
      setTimeout(() => {
        socket.emit('START_NEW_ROUND', {});
      }, 3000); // Wait 3 seconds
    }
  }
});

socket.on('GAME_END', (data) => {
  console.log(`${data.winner.name} won the game!`);
  console.log('Final standings:', data.finalStandings);
});
```

---

## 🚦 Event Flow Sequence

```
1. CREATE_ROOM (host)
   ├─→ ROOM_UPDATED

2. JOIN_ROOM (players)
   ├─→ PLAYER_JOINED
   └─→ ROOM_UPDATED

3. START_GAME (host)
   ├─→ GAME_STARTED
   ├─→ DEAL_CARDS (to each player)
   └─→ GAME_STATE_UPDATE

4. PLAYER_ACTION (each turn)
   ├─→ PLAYER_ACTION_RESULT
   └─→ GAME_STATE_UPDATE

5. REQUEST_SHOWDOWN (when betting done)
   └─→ SHOWDOWN
       ├─→ If game continues:
       │   └─→ START_NEW_ROUND → back to step 3
       └─→ If game ends:
           └─→ GAME_END
```

---

## ⚠️ Common Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Room not found" | Invalid room code | Check room code |
| "Not your turn" | Acting out of turn | Wait for your turn |
| "Game already started" | Joining after start | Join before game starts |
| "Only host can start game" | Non-host trying to start | Host must start |
| "Need at least 2 players" | Too few players | Wait for more players |
| "Insufficient points" | Not enough points | Go all-in or fold |
| "Action not available" | Invalid action | Check available actions |

---

## 💡 Best Practices

1. **Always listen for events** before emitting
2. **Handle errors** in callbacks
3. **Check `currentTurnSocketId`** before showing action buttons
4. **Show only available actions** from turn manager
5. **Hide other players' cards** (only show in showdown)
6. **Display pot and stakes** prominently
7. **Handle disconnections** gracefully
8. **Update UI** on every GAME_STATE_UPDATE

---

## 🔗 Connection Example

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

socket.on('connect', () => {
  console.log('Connected to game server!');
});

socket.on('disconnect', () => {
  console.log('Disconnected from game server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

**🎮 Keep this reference handy while building your frontend!**
