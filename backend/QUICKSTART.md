# 🚀 Quick Start Guide

## Installation & Running

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Start the Server
```bash
npm start
```

Server will run on **http://localhost:3001**

### 3️⃣ Test the Server (Optional)

In a **separate terminal**, run the test client:
```bash
npm test
```

This will simulate 3 players joining a room and playing a round.

---

## 📂 File Structure Explained

```
Poker-lite/
│
├── server.js                 # 🚪 Main entry point, starts Express & Socket.IO
│
├── handlers/
│   └── socketHandlers.js     # 🎮 All Socket.IO event handlers
│
├── utils/
│   ├── deckHandler.js        # 🎴 Card creation, shuffling, dealing
│   ├── roomManager.js        # 🏠 Room creation, player management
│   ├── gameStateManager.js   # 🎯 Game rounds, betting, winners
│   ├── turnManager.js        # ⏱️ Turn validation, action checking
│   └── constants.js          # ⚙️ Game configuration constants
│
├── examples/
│   └── testClient.js         # 🧪 Test script to verify server
│
├── package.json              # 📦 Dependencies & scripts
└── README.md                 # 📖 Full documentation
```

---

## 🔌 Connecting from React Client

### Install Socket.IO Client
```bash
npm install socket.io-client
```

### Basic Connection Example
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to game server!');
});

// Create a room
socket.emit('CREATE_ROOM', {
  playerName: 'YourName',
  initialStake: 100
}, (response) => {
  if (response.success) {
    console.log('Room Code:', response.roomCode);
    // Store roomCode for others to join
  }
});

// Join a room
socket.emit('JOIN_ROOM', {
  roomCode: 'ABC123',
  playerName: 'YourName'
}, (response) => {
  if (response.success) {
    console.log('Joined room!');
  }
});

// Listen for cards
socket.on('DEAL_CARDS', (data) => {
  console.log('Your cards:', data.cards);
});

// Listen for game state
socket.on('GAME_STATE_UPDATE', (data) => {
  console.log('Game state:', data);
});

// Make a bet
socket.emit('PLAYER_ACTION', {
  action: 'bet',
  amount: 150
}, (response) => {
  if (response.success) {
    console.log('Bet placed!');
  }
});
```

---

## 🎮 Typical Game Flow

1. **Host creates room** → Gets room code
2. **Players join** using room code (2-8 players)
3. **Host starts game** → Cards are dealt
4. **Betting phase:**
   - Players take turns
   - Actions: bet, call, raise, fold, all-in
5. **Round ends:**
   - Automatic if only 1 player left
   - Manual showdown when betting complete
6. **Winner determined:**
   - Highest card wins
   - Pot distributed
7. **New round starts** (repeat until 1 player remains)

---

## 🔍 Debugging Tips

### Check Server Status
```bash
curl http://localhost:3001/health
```

### View Available Events
```bash
curl http://localhost:3001/
```

### Common Issues

**Port already in use:**
```bash
# Use a different port
PORT=4000 npm start
```

**Cannot connect from React:**
- Ensure server is running
- Check CORS settings in server.js
- Verify Socket.IO client URL matches server URL

**Game not starting:**
- Need at least 2 players
- Only host can start game
- Check console for error messages

---

## 📋 All Available Socket Events

### 🔵 Client → Server
- `CREATE_ROOM` - Create new game room
- `JOIN_ROOM` - Join existing room
- `LEAVE_ROOM` - Leave current room
- `START_GAME` - Start game (host only)
- `PLAYER_ACTION` - Bet/call/raise/fold/all-in
- `REQUEST_SHOWDOWN` - End round manually
- `START_NEW_ROUND` - Begin next round (host only)
- `GET_GAME_STATE` - Request current state

### 🟢 Server → Client
- `ROOM_UPDATED` - Room state changed
- `PLAYER_JOINED` - New player joined
- `PLAYER_LEFT` - Player left
- `PLAYER_DISCONNECTED` - Player disconnected
- `GAME_STARTED` - Game began
- `DEAL_CARDS` - Your cards (private)
- `PLAYER_ACTION_RESULT` - Action performed
- `GAME_STATE_UPDATE` - Current game state
- `SHOWDOWN` - Round ended, winners shown
- `ROUND_START` - New round began
- `GAME_END` - Game finished

---

## 🎯 Next Steps

1. ✅ Server is running
2. 📱 Build React frontend
3. 🎨 Design UI components
4. 🔗 Connect frontend to this backend
5. 🎮 Test multiplayer gameplay!

---

## 💡 Tips for Frontend Development

- **Store room code** for sharing with friends
- **Display current turn** clearly
- **Show player's own cards** prominently
- **Hide other players' cards**
- **Show pot and stakes** prominently
- **Enable/disable action buttons** based on turn
- **Display game state** (round number, points, etc.)
- **Handle disconnections** gracefully

---

## 🆘 Need Help?

Check the full [README.md](README.md) for:
- Complete API documentation
- Game rules details
- Socket event schemas
- Player state structure

---

**Happy coding! 🎉**
