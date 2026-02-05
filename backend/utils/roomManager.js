/**
 * Room Manager Module
 * Manages game rooms, room codes, and player membership
 * Supports 2-8 players per room
 */

class RoomManager {
  constructor() {
    // In-memory storage for rooms
    this.rooms = new Map();
  }

  /**
   * Generate a unique 6-character room code
   * @returns {string} Room code
   */
  generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code;
    
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
    } while (this.rooms.has(code)); // Ensure uniqueness
    
    return code;
  }

  /**
   * Create a new room
   * @param {string} hostName - Name of the room creator
   * @param {string} hostSocketId - Socket ID of the host
   * @param {number} initialStake - Starting stake for the room
   * @returns {Object} Room object
   */
  createRoom(hostName, hostSocketId, initialStake = 100) {
    const roomCode = this.generateRoomCode();
    
    const room = {
      code: roomCode,
      hostId: hostSocketId,
      players: [],
      maxPlayers: 8,
      minPlayers: 2,
      initialStake,
      currentStake: initialStake,
      roundNumber: 0,
      gameStarted: false,
      gameEnded: false,
      createdAt: Date.now()
    };
    
    this.rooms.set(roomCode, room);
    
    // Add host as first player
    this.addPlayerToRoom(roomCode, {
      id: this.generatePlayerId(),
      name: hostName,
      socketId: hostSocketId,
      points: 1000, // Default starting points
      isHost: true
    });
    
    return room;
  }

  /**
   * Generate unique player ID
   * @returns {string} Player ID
   */
  generatePlayerId() {
    return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add player to a room
   * @param {string} roomCode - Room code
   * @param {Object} playerData - Player information
   * @returns {Object|null} Updated room or null if failed
   */
  addPlayerToRoom(roomCode, playerData) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }
    
    if (room.gameStarted) {
      return { error: 'Game already started' };
    }
    
    if (room.players.length >= room.maxPlayers) {
      return { error: 'Room is full' };
    }
    
    // Check if player already in room
    const existingPlayer = room.players.find(p => p.socketId === playerData.socketId);
    if (existingPlayer) {
      return { error: 'Already in room' };
    }
    
    // Create player object with game state
    const player = {
      id: playerData.id,
      name: playerData.name,
      socketId: playerData.socketId,
      points: playerData.points || 1000,
      cards: [],
      currentBet: 0,
      hasFolded: false,
      isAllIn: false,
      isEliminated: false,
      isSpectator: false,
      isHost: playerData.isHost || false
    };
    
    room.players.push(player);
    
    return room;
  }

  /**
   * Remove player from room
   * @param {string} roomCode - Room code
   * @param {string} socketId - Socket ID of player to remove
   * @returns {Object|null} Updated room or null
   */
  removePlayerFromRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    
    if (!room) return null;
    
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    
    if (playerIndex === -1) return null;
    
    const removedPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    
    // If host left, assign new host
    if (removedPlayer.isHost && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].socketId;
    }
    
    // Delete room if empty
    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
      return null;
    }
    
    return room;
  }

  /**
   * Get room by code
   * @param {string} roomCode - Room code
   * @returns {Object|null} Room object or null
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * Get room by socket ID
   * @param {string} socketId - Socket ID
   * @returns {Object|null} Room object or null
   */
  getRoomBySocketId(socketId) {
    for (const [code, room] of this.rooms.entries()) {
      if (room.players.some(p => p.socketId === socketId)) {
        return room;
      }
    }
    return null;
  }

  /**
   * Get player from room
   * @param {string} roomCode - Room code
   * @param {string} socketId - Socket ID
   * @returns {Object|null} Player object or null
   */
  getPlayer(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    
    return room.players.find(p => p.socketId === socketId) || null;
  }

  /**
   * Check if room can start game
   * @param {string} roomCode - Room code
   * @returns {boolean} True if game can start
   */
  canStartGame(roomCode) {
    const room = this.rooms.get(roomCode);
    
    if (!room) return false;
    if (room.gameStarted) return false;
    if (room.players.length < room.minPlayers) return false;
    
    return true;
  }

  /**
   * Get all active (non-eliminated, non-spectator) players
   * @param {string} roomCode - Room code
   * @returns {Array} Array of active players
   */
  getActivePlayers(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    
    return room.players.filter(p => !p.isEliminated && !p.isSpectator);
  }

  /**
   * Get all players who haven't folded in current round
   * @param {string} roomCode - Room code
   * @returns {Array} Array of players still in the round
   */
  getPlayersInRound(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    
    return room.players.filter(p => 
      !p.isEliminated && 
      !p.isSpectator && 
      !p.hasFolded
    );
  }
}

module.exports = new RoomManager();
