/**
 * Socket Event Handlers
 * Handles all Socket.IO events for room and game management
 * Server is authoritative - all game logic happens server-side
 */

const roomManager = require('../utils/roomManager');
const gameStateManager = require('../utils/gameStateManager');
const turnManager = require('../utils/turnManager');

// Store turn timers
const turnTimers = new Map(); // roomCode -> { timeoutId, intervalId, startTime, playerId }
const TURN_TIMEOUT = 30000; // 30 seconds

/**
 * Clear and stop turn timer for a room
 */
const clearTurnTimer = (roomCode) => {
  const timerData = turnTimers.get(roomCode);
  if (timerData) {
    if (timerData.timeoutId) clearTimeout(timerData.timeoutId);
    if (timerData.intervalId) clearInterval(timerData.intervalId);
    turnTimers.delete(roomCode);
    console.log(`[TIMER] Cleared timer for room ${roomCode}`);
  }
};

/**
 * Start turn timer for current player
 */
const startTurnTimer = (roomCode, playerId, io) => {
  // Clear any existing timer
  clearTurnTimer(roomCode);

  const startTime = Date.now();
  
  // Send initial timer update
  io.to(roomCode).emit('TURN_TIMER_UPDATE', {
    playerId,
    timeRemaining: 30
  });

  // Update timer every second
  const intervalId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.ceil((TURN_TIMEOUT - elapsed) / 1000);
    
    if (remaining > 0) {
      io.to(roomCode).emit('TURN_TIMER_UPDATE', {
        playerId,
        timeRemaining: remaining
      });
    }
  }, 1000);

  // Auto-fold when timer expires
  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);
    
    const room = roomManager.getRoom(roomCode);
    if (room && room.gameStarted && !room.gameEnded) {
      const player = room.players.find(p => p.id === playerId);
      
      if (player && !player.hasFolded && !player.isEliminated) {
        console.log(`[TIMER] Auto-folding ${player.name} in room ${roomCode}`);
        
        // Process automatic fold
        const result = gameStateManager.processPlayerAction(roomCode, player.socketId, 'fold', 0);
        
        // Notify all players
        io.to(roomCode).emit('PLAYER_ACTION_RESULT', {
          playerId: player.id,
          playerName: player.name,
          action: 'fold',
          amount: 0,
          autoFold: true,
          pot: result.pot,
          currentTurnIndex: result.currentTurnIndex
        });

        // Update game state
        const state = gameStateManager.getGameState(roomCode);
        io.to(roomCode).emit('GAME_STATE_UPDATE', state);
      }
    }
    
    turnTimers.delete(roomCode);
  }, TURN_TIMEOUT);

  turnTimers.set(roomCode, { timeoutId, intervalId, startTime, playerId });
  console.log(`[TIMER] Started 30s timer for player ${playerId} in room ${roomCode}`);
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`[CONNECTION] Player connected: ${socket.id}`);

    /**
     * CREATE_ROOM
     * Creates a new game room
     * Payload: { playerName, initialStake, maxPlayers, startingPoints }
     */
    socket.on('CREATE_ROOM', (data, callback) => {
      try {
        const { 
          playerName, 
          initialStake = 100, 
          maxPlayers = 8,
          startingPoints = 1000
        } = data;

        if (!playerName || playerName.trim() === '') {
          return callback({ error: 'Player name is required' });
        }

        // Validate parameters
        if (maxPlayers < 2 || maxPlayers > 8) {
          return callback({ error: 'Max players must be between 2 and 8' });
        }

        if (initialStake < 1) {
          return callback({ error: 'Initial stake must be at least 1' });
        }

        if (startingPoints < initialStake) {
          return callback({ error: 'Starting points must be at least the initial stake' });
        }

        const room = roomManager.createRoom(
          playerName, 
          socket.id, 
          initialStake,
          maxPlayers,
          startingPoints
        );

        // Join socket room
        socket.join(room.code);

        console.log(`[CREATE_ROOM] ${playerName} created room ${room.code} (max: ${maxPlayers}, stake: ${initialStake}, points: ${startingPoints})`);

        callback({
          success: true,
          roomCode: room.code,
          room: {
            code: room.code,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              points: p.points,
              isHost: p.isHost,
              socketId: p.socketId
            })),
            initialStake: room.initialStake,
            maxPlayers: room.maxPlayers,
            gameStarted: room.gameStarted
          }
        });

        // Broadcast room update to all players in room
        io.to(room.code).emit('ROOM_UPDATED', {
          room: {
            code: room.code,
            players: room.players.map(p => ({
              id: p.id,
              name: p.name,
              points: p.points,
              isHost: p.isHost,
              socketId: p.socketId
            })),
            gameStarted: room.gameStarted
          }
        });

      } catch (error) {
        console.error('[CREATE_ROOM] Error:', error);
        callback({ error: 'Failed to create room' });
      }
    });

    /**
     * JOIN_ROOM
     * Join an existing room by code
     * Payload: { roomCode, playerName }
     */
    socket.on('JOIN_ROOM', (data, callback) => {
      try {
        const { roomCode, playerName } = data;

        if (!roomCode || !playerName) {
          return callback({ error: 'Room code and player name are required' });
        }

        const playerId = roomManager.generatePlayerId();
        const result = roomManager.addPlayerToRoom(roomCode, {
          id: playerId,
          name: playerName,
          socketId: socket.id
        });

        if (result.error) {
          return callback({ error: result.error });
        }

        // Join socket room
        socket.join(roomCode);

        console.log(`[JOIN_ROOM] ${playerName} joined room ${roomCode}`);

        callback({
          success: true,
          roomCode: roomCode,
          playerId: playerId,
          room: {
            code: result.code,
            players: result.players.map(p => ({
              id: p.id,
              name: p.name,
              points: p.points,
              isHost: p.isHost,
              socketId: p.socketId
            })),
            gameStarted: result.gameStarted
          }
        });

        // Broadcast to all players in room
        io.to(roomCode).emit('PLAYER_JOINED', {
          player: {
            id: playerId,
            name: playerName,
            socketId: socket.id
          },
          room: {
            code: result.code,
            players: result.players.map(p => ({
              id: p.id,
              name: p.name,
              points: p.points,
              isHost: p.isHost,
              socketId: p.socketId
            })),
            gameStarted: result.gameStarted
          }
        });

      } catch (error) {
        console.error('[JOIN_ROOM] Error:', error);
        callback({ error: 'Failed to join room' });
      }
    });

    /**
     * LEAVE_ROOM
     * Leave current room
     */
    socket.on('LEAVE_ROOM', (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ error: 'Not in a room' });
        }

        const roomCode = room.code;
        const player = roomManager.getPlayer(roomCode, socket.id);

        // Clear turn timer if this room had one
        clearTurnTimer(roomCode);

        const updatedRoom = roomManager.removePlayerFromRoom(roomCode, socket.id);

        socket.leave(roomCode);

        console.log(`[LEAVE_ROOM] ${player.name} left room ${roomCode}`);

        callback({ success: true });

        // If room still exists, notify remaining players
        if (updatedRoom) {
          io.to(roomCode).emit('PLAYER_LEFT', {
            playerId: player.id,
            playerName: player.name,
            room: {
              code: updatedRoom.code,
              players: updatedRoom.players.map(p => ({
                id: p.id,
                name: p.name,
                points: p.points,
                isHost: p.isHost,
                socketId: p.socketId
              })),
              gameStarted: updatedRoom.gameStarted
            }
          });
        }

      } catch (error) {
        console.error('[LEAVE_ROOM] Error:', error);
        callback({ error: 'Failed to leave room' });
      }
    });

    /**
     * START_GAME
     * Start the game (host only)
     */
    socket.on('START_GAME', (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ error: 'Not in a room' });
        }

        const player = roomManager.getPlayer(room.code, socket.id);

        if (!player.isHost) {
          return callback({ error: 'Only host can start game' });
        }

        if (!roomManager.canStartGame(room.code)) {
          return callback({ error: 'Need at least 2 players to start' });
        }

        const gameState = gameStateManager.startGame(room.code);

        if (gameState.error) {
          return callback({ error: gameState.error });
        }

        console.log(`[START_GAME] Game started in room ${room.code}`);

        callback({ success: true });

        // Broadcast game start to all players
        io.to(room.code).emit('GAME_STARTED', {
          roundNumber: gameState.roundNumber,
          currentStake: gameState.currentStake,
          pot: gameState.pot
        });

        // Deal cards to each player (send privately)
        room.players.forEach(p => {
          if (!p.isEliminated && !p.isSpectator && p.cards.length > 0) {
            io.to(p.socketId).emit('DEAL_CARDS', {
              cards: p.cards
            });
          }
        });

        // Broadcast game state to all
        const state = gameStateManager.getGameState(room.code);
        io.to(room.code).emit('GAME_STATE_UPDATE', state);

        // Check if round should end immediately (e.g., all players all-in)
        const roundEndCheck = gameStateManager.checkRoundEnd(room.code);
        if (roundEndCheck.shouldEnd) {
          console.log(`[START_GAME] Round ending immediately: ${roundEndCheck.reason}`);
          const showdownResult = gameStateManager.endRound(room.code);
          io.to(room.code).emit('SHOWDOWN', showdownResult);
        } else {
          // Start timer for current player's turn
          const currentPlayer = room.players[room.currentTurnIndex];
          if (currentPlayer && !currentPlayer.isEliminated && !currentPlayer.hasFolded) {
            startTurnTimer(room.code, currentPlayer.id, io);
          }
        }

      } catch (error) {
        console.error('[START_GAME] Error:', error);
        callback({ error: 'Failed to start game' });
      }
    });

    /**
     * PLAYER_ACTION
     * Process player action (bet, call, raise, fold, all-in)
     * Payload: { action, amount }
     */
    socket.on('PLAYER_ACTION', (data, callback) => {
      try {
        const { action, amount = 0 } = data;

        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          if (callback) return callback({ error: 'Not in a room' });
          return;
        }

        if (!room.gameStarted || room.gameEnded) {
          if (callback) return callback({ error: 'Game not in progress' });
          return;
        }

        // Validate action
        const validation = turnManager.validateAction(room.code, socket.id, action, amount);

        if (!validation.valid) {
          if (callback) return callback({ error: validation.error });
          return;
        }

        // Process action
        const result = gameStateManager.processPlayerAction(room.code, socket.id, action, amount);

        if (result.error) {
          if (callback) return callback({ error: result.error });
          return;
        }

        const player = roomManager.getPlayer(room.code, socket.id);

        console.log(`[PLAYER_ACTION] ${player.name} performed ${action} in room ${room.code}`);

        // Clear timer for this player
        clearTurnTimer(room.code);

        // Check if action caused immediate round end (e.g., fold leaving one player)
        if (result.roundEnded) {
          console.log(`[PLAYER_ACTION] Round ended immediately after ${action}`);
          
          if (callback) callback({ success: true, result });

          // Broadcast the action first
          io.to(room.code).emit('PLAYER_ACTION_RESULT', {
            playerId: player.id,
            playerName: player.name,
            action,
            amount,
            pot: result.pot || room.pot,
            currentTurnIndex: result.currentTurnIndex
          });

          // Then broadcast showdown results
          io.to(room.code).emit('SHOWDOWN', result);
          return;
        }

        if (callback) callback({ success: true, result });

        // Broadcast action to all players
        io.to(room.code).emit('PLAYER_ACTION_RESULT', {
          playerId: player.id,
          playerName: player.name,
          action,
          amount,
          pot: result.pot,
          currentTurnIndex: result.currentTurnIndex
        });

        // Update game state
        const state = gameStateManager.getGameState(room.code);
        io.to(room.code).emit('GAME_STATE_UPDATE', state);

        // Start timer for next player if game continues
        if (!room.gameEnded && room.gameStarted) {
          const roundEndCheck = gameStateManager.checkRoundEnd(room.code);
          if (!roundEndCheck.shouldEnd) {
            const currentPlayer = room.players[room.currentTurnIndex];
            if (currentPlayer && !currentPlayer.isEliminated && !currentPlayer.hasFolded) {
              startTurnTimer(room.code, currentPlayer.id, io);
            }
          }
        }

      } catch (error) {
        console.error('[PLAYER_ACTION] Error:', error);
        if (callback) callback({ error: 'Failed to process action' });
      }
    });

    /**
     * REQUEST_SHOWDOWN
     * Manually trigger showdown (for testing or if all bets matched)
     */
    socket.on('REQUEST_SHOWDOWN', (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ error: 'Not in a room' });
        }

        if (!turnManager.isBettingComplete(room.code)) {
          return callback({ error: 'Betting not complete' });
        }

        const roundEndData = gameStateManager.endRound(room.code);

        console.log(`[SHOWDOWN] Round ${roundEndData.roundNumber} ended in room ${room.code}`);

        callback({ success: true });

        // Broadcast showdown results
        io.to(room.code).emit('SHOWDOWN', roundEndData);

        // If game ended
        if (roundEndData.gameEnded) {
          io.to(room.code).emit('GAME_END', {
            winner: roundEndData.gameWinner,
            finalStandings: roundEndData.playersState
          });
        }

      } catch (error) {
        console.error('[REQUEST_SHOWDOWN] Error:', error);
        callback({ error: 'Failed to process showdown' });
      }
    });

    /**
     * START_NEW_ROUND
     * Start next round after previous round ends
     */
    socket.on('START_NEW_ROUND', (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ error: 'Not in a room' });
        }

        const player = roomManager.getPlayer(room.code, socket.id);

        if (!player.isHost) {
          return callback({ error: 'Only host can start new round' });
        }

        if (room.gameEnded) {
          return callback({ error: 'Game has ended' });
        }

        const roundState = gameStateManager.startNewRound(room.code);

        if (roundState.error || roundState.gameEnded) {
          // Game ended
          io.to(room.code).emit('GAME_END', roundState);
          return callback({ success: true, gameEnded: true });
        }

        console.log(`[NEW_ROUND] Round ${roundState.roundNumber} started in room ${room.code}`);

        callback({ success: true });

        // Broadcast new round
        io.to(room.code).emit('ROUND_START', {
          roundNumber: roundState.roundNumber,
          currentStake: roundState.currentStake,
          pot: roundState.pot
        });

        // Deal cards to each active player
        room.players.forEach(p => {
          if (!p.isEliminated && !p.isSpectator && p.cards.length > 0) {
            io.to(p.socketId).emit('DEAL_CARDS', {
              cards: p.cards
            });
          }
        });

        // Broadcast game state
        const state = gameStateManager.getGameState(room.code);
        io.to(room.code).emit('GAME_STATE_UPDATE', state);

        // Check if round should end immediately (e.g., all players all-in)
        const roundEndCheck = gameStateManager.checkRoundEnd(room.code);
        if (roundEndCheck.shouldEnd) {
          console.log(`[NEW_ROUND] Round ending immediately: ${roundEndCheck.reason}`);
          const showdownResult = gameStateManager.endRound(room.code);
          io.to(room.code).emit('SHOWDOWN', showdownResult);
        } else {
          // Start timer for current player's turn
          const currentPlayer = room.players[room.currentTurnIndex];
          if (currentPlayer && !currentPlayer.isEliminated && !currentPlayer.hasFolded) {
            startTurnTimer(room.code, currentPlayer.id, io);
          }
        }

      } catch (error) {
        console.error('[START_NEW_ROUND] Error:', error);
        callback({ error: 'Failed to start new round' });
      }
    });

    /**
     * GET_GAME_STATE
     * Request current game state
     */
    socket.on('GET_GAME_STATE', (data, callback) => {
      try {
        const room = roomManager.getRoomBySocketId(socket.id);

        if (!room) {
          return callback({ error: 'Not in a room' });
        }

        const state = gameStateManager.getGameState(room.code);
        const player = roomManager.getPlayer(room.code, socket.id);

        // Include player's cards if they have any
        if (player && player.cards.length > 0) {
          state.myCards = player.cards;
        }

        callback({ success: true, state });

      } catch (error) {
        console.error('[GET_GAME_STATE] Error:', error);
        callback({ error: 'Failed to get game state' });
      }
    });

    /**
     * Handle disconnect
     */
    socket.on('disconnect', () => {
      console.log(`[DISCONNECT] Player disconnected: ${socket.id}`);

      const room = roomManager.getRoomBySocketId(socket.id);

      if (room) {
        const player = roomManager.getPlayer(room.code, socket.id);
        const roomCode = room.code;

        // Clear turn timer if this room had one
        clearTurnTimer(roomCode);

        const updatedRoom = roomManager.removePlayerFromRoom(roomCode, socket.id);

        if (player) {
          console.log(`[DISCONNECT] ${player.name} removed from room ${roomCode}`);

          // Notify remaining players
          if (updatedRoom) {
            io.to(roomCode).emit('PLAYER_DISCONNECTED', {
              playerId: player.id,
              playerName: player.name,
              room: {
                code: updatedRoom.code,
                players: updatedRoom.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  points: p.points,
                  isHost: p.isHost,
                  socketId: p.socketId
                })),
                gameStarted: updatedRoom.gameStarted
              }
            });
          }
        }
      }
    });
  });
};
