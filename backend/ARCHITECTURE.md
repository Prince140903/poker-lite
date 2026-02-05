# 📐 Architecture & Flow Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Client(s)                       │
│         (2-8 players per room, Socket.IO client)        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       │ WebSocket (Socket.IO)
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   SERVER (Node.js)                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │          server.js (Main Entry)                │    │
│  │  - Express HTTP Server                         │    │
│  │  - Socket.IO Server                           │    │
│  └─────────────────┬──────────────────────────────┘    │
│                    │                                     │
│  ┌─────────────────▼──────────────────────────────┐    │
│  │       handlers/socketHandlers.js              │    │
│  │  - CREATE_ROOM                                 │    │
│  │  - JOIN_ROOM, LEAVE_ROOM                      │    │
│  │  - START_GAME, START_NEW_ROUND                │    │
│  │  - PLAYER_ACTION                              │    │
│  │  - REQUEST_SHOWDOWN                           │    │
│  └──────────────────┬─────────────────────────────┘    │
│                     │                                    │
│       ┌─────────────┼─────────────┬──────────────┐     │
│       │             │             │              │     │
│  ┌────▼───┐  ┌─────▼────┐  ┌────▼────┐  ┌──────▼──┐  │
│  │  room  │  │   game   │  │  deck   │  │  turn   │  │
│  │Manager │  │StateMgr  │  │ Handler │  │ Manager │  │
│  └────────┘  └──────────┘  └─────────┘  └─────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │        In-Memory Storage (Map)                 │    │
│  │  - Rooms                                       │    │
│  │  - Players                                     │    │
│  │  - Game States                                │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 🎮 Game Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    GAME LIFECYCLE                        │
└─────────────────────────────────────────────────────────┘

1. LOBBY PHASE
   │
   ├─→ Host creates room (CREATE_ROOM)
   │   └─→ Receives room code
   │
   ├─→ Players join (JOIN_ROOM)
   │   └─→ 2-8 players required
   │
   └─→ Host starts game (START_GAME)
       └─→ Game begins ✓

                    ↓

2. ROUND START
   │
   ├─→ Increment round number
   ├─→ Update stake (every 5 rounds: stake × 2)
   ├─→ Reset player states
   ├─→ Check for eliminated players (points = 0)
   ├─→ Create & shuffle deck
   └─→ Deal 2 cards to each active player
       └─→ DEAL_CARDS event (private to each player)

                    ↓

3. BETTING PHASE (Turn-based)
   │
   │  Current Player's Turn
   │  ↓
   │  ├─→ Available actions:
   │  │   • Bet (if no bets yet)
   │  │   • Call (match highest bet)
   │  │   • Raise (increase bet)
   │  │   • Fold (give up, lose stake)
   │  │   • All-in (bet all remaining points)
   │  │
   │  ├─→ PLAYER_ACTION event
   │  │   └─→ Server validates action
   │  │       └─→ Update pot & player state
   │  │           └─→ PLAYER_ACTION_RESULT broadcast
   │  │
   │  └─→ Move to next player
   │      └─→ Repeat until betting complete
   │
   │  Betting ends when:
   │  • Only 1 player left (others folded)
   │  • All active players' bets match
   │  • All players all-in

                    ↓

4. ROUND END
   │
   ├─→ Case A: Only 1 player left
   │   └─→ That player wins pot
   │
   └─→ Case B: Showdown (2+ players)
       ├─→ Compare hand values
       ├─→ Highest value wins
       └─→ Ties split pot equally
       
       └─→ SHOWDOWN event broadcast

                    ↓

5. CHECK GAME END
   │
   ├─→ Active players > 1?
   │   └─→ YES: START_NEW_ROUND → back to step 2
   │
   └─→ Active players = 1?
       └─→ YES: GAME_END
           └─→ Declare winner
               └─→ Show final standings
```

---

## 🔄 Round State Machine

```
┌──────────────┐
│   WAITING    │ (Lobby, not started)
└──────┬───────┘
       │ START_GAME
       ▼
┌──────────────┐
│ ROUND_START  │ (Deal cards, reset states)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   BETTING    │◄─────┐ (Turn-based actions)
└──────┬───────┘      │
       │              │
       │ Betting      │ Next
       │ complete?    │ turn
       │              │
       ▼              │
┌──────────────┐      │
│ CHECK_END?   │──NO──┘
└──────┬───────┘
       │ YES
       ▼
┌──────────────┐
│  SHOWDOWN    │ (Determine winner, distribute pot)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  ROUND_END   │
└──────┬───────┘
       │
       ├──→ More active players?
       │    └─→ YES: Back to ROUND_START
       │
       └──→ Only 1 player left?
            └─→ YES: GAME_END
```

---

## 👥 Player State Transitions

```
NEW PLAYER
   │
   ├─→ Join room
   │   └─→ STATE: Active, points = 1000
   │
   └─→ Game starts
       │
       ├─→ Receive 2 cards
       │
       └─→ Each Round:
           │
           ├─→ ACTIVE
           │   ├─→ Has points > 0
           │   ├─→ Can receive cards
           │   └─→ Can bet/call/raise/fold/all-in
           │
           ├─→ FOLDED
           │   ├─→ hasFolded = true
           │   ├─→ Out of current round
           │   └─→ Reset next round
           │
           ├─→ ALL-IN
           │   ├─→ isAllIn = true
           │   ├─→ Points = 0 (temporarily)
           │   ├─→ Still in showdown
           │   └─→ Cannot act until round ends
           │
           └─→ ELIMINATED
               ├─→ Points = 0 permanently
               ├─→ isEliminated = true
               ├─→ Becomes spectator
               └─→ Cannot play anymore
```

---

## 🎴 Card & Hand System

```
DECK (52 cards)
   │
   ├─→ 4 Suits: ♥ ♦ ♣ ♠
   │
   └─→ 13 Ranks: 2-10, J, Q, K, A

CARD VALUES (Suits IGNORED)
   2  = 2
   3  = 3
   ...
   10 = 10
   J  = 11
   Q  = 12
   K  = 13
   A  = 14 (highest)

HAND VALUE CALCULATION
   │
   ├─→ Each player has 2 cards
   │
   └─→ Hand Value = MAX(card1.value, card2.value)
       │
       └─→ Simple highest card wins!

EXAMPLE:
   Player A: [K♥, 5♦] → Value = 13
   Player B: [7♣, A♠] → Value = 14
   Player C: [Q♥, 10♦] → Value = 12
   
   Winner: Player B (highest value = 14)
```

---

## 💰 Betting Mechanics

```
STAKE SYSTEM
   │
   ├─→ Initial stake: Set at room creation (default 100)
   │
   ├─→ Round 1-5: stake = 100
   ├─→ Round 6-10: stake = 200
   ├─→ Round 11-15: stake = 400
   └─→ Doubles every 5 rounds

POT ACCUMULATION
   │
   ├─→ When player folds: stake → pot
   ├─→ When player bets: amount → pot
   ├─→ When player calls: call amount → pot
   ├─→ When player raises: raise amount → pot
   └─→ When player all-in: all points → pot

ACTION RULES
   │
   ├─→ BET
   │   ├─→ First bet of round
   │   ├─→ Must be ≥ current stake
   │   └─→ Sets highestBet
   │
   ├─→ CALL
   │   ├─→ Match current highestBet
   │   └─→ Pay difference: (highestBet - currentBet)
   │
   ├─→ RAISE
   │   ├─→ Increase current bet
   │   ├─→ Must be > highestBet
   │   └─→ Updates highestBet
   │
   ├─→ FOLD
   │   ├─→ Give up round
   │   ├─→ Pay stake to pot
   │   └─→ hasFolded = true
   │
   └─→ ALL-IN
       ├─→ Bet all remaining points
       ├─→ May be < stake (allowed!)
       ├─→ isAllIn = true
       └─→ Skip future turns this round
```

---

## 🔐 Security & Validation

```
SERVER AUTHORITATIVE
   │
   ├─→ All game logic on server
   │   └─→ Clients cannot manipulate
   │
   ├─→ Card dealing server-side
   │   └─→ Players only see own cards
   │
   ├─→ Turn validation
   │   └─→ Only current player can act
   │
   ├─→ Action validation
   │   └─→ Invalid actions rejected
   │
   └─→ Point tracking server-side
       └─→ Cannot cheat with points
```

---

## 📡 Socket Event Flow Example

```
CLIENT (Alice)          SERVER              BROADCAST
   │                      │                     │
   ├─CREATE_ROOM─────────►│                     │
   │                      ├─Create room         │
   │                      ├─Join Alice          │
   │◄────Response─────────┤                     │
   │  {roomCode: 'ABC'}   │                     │
   │                      │                     │
                          │                     │
CLIENT (Bob)              │                     │
   │                      │                     │
   ├─JOIN_ROOM───────────►│                     │
   │  {code: 'ABC'}       ├─Add Bob to room     │
   │◄────Response─────────┤                     │
   │                      ├─PLAYER_JOINED──────►│
   │                      │                     └─►All in room
   │                      │                     │
CLIENT (Alice)            │                     │
   │                      │                     │
   ├─START_GAME──────────►│                     │
   │                      ├─Start game          │
   │                      ├─Deal cards          │
   │◄────Response─────────┤                     │
   │                      ├─GAME_STARTED───────►│
   │◄─DEAL_CARDS──────────┤                     │
   │  (private)           │                     │
                          ├─DEAL_CARDS──────────►Bob (private)
                          │                     │
                          ├─GAME_STATE_UPDATE──►│
                          │                     └─►All in room
   │                      │                     │
   ├─PLAYER_ACTION───────►│                     │
   │  {action: 'bet'}     ├─Validate            │
   │                      ├─Process action      │
   │◄────Response─────────┤                     │
   │                      ├─PLAYER_ACTION_RESULT►│
   │                      │                     └─►All in room
   │                      ├─GAME_STATE_UPDATE──►│
   │                      │                     └─►All in room
```

---

## 🎯 Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| **server.js** | Entry point, HTTP & Socket.IO setup |
| **socketHandlers.js** | Handle all Socket.IO events |
| **roomManager.js** | Room creation, player join/leave |
| **gameStateManager.js** | Game rounds, betting logic, winners |
| **deckHandler.js** | Card creation, shuffling, dealing, comparison |
| **turnManager.js** | Turn validation, action availability |
| **constants.js** | Configuration values |

---

## 📊 Data Structures

### Room Object
```javascript
{
  code: 'ABC123',
  hostId: 'socket_id',
  players: [...], // Array of Player objects
  maxPlayers: 8,
  minPlayers: 2,
  initialStake: 100,
  currentStake: 100,
  roundNumber: 0,
  gameStarted: false,
  gameEnded: false,
  pot: 0,
  highestBet: 0,
  currentTurnIndex: 0,
  deck: [...] // Remaining cards
}
```

### Player Object
```javascript
{
  id: 'unique_id',
  name: 'PlayerName',
  socketId: 'socket_id',
  points: 1000,
  cards: [], // [card1, card2]
  currentBet: 0,
  hasFolded: false,
  isAllIn: false,
  isEliminated: false,
  isSpectator: false,
  isHost: false
}
```

### Card Object
```javascript
{
  suit: 'hearts', // hearts, diamonds, clubs, spades
  rank: 'A',      // 2-10, J, Q, K, A
  value: 14       // Numeric value
}
```

---

**Use these diagrams to understand the system architecture! 📐**
