/**
 * Turn Manager
 * Manages betting rounds and turn progression
 * Validates player actions based on game state
 */

const roomManager = require('./roomManager');

class TurnManager {
  /**
   * Validate if it's a player's turn
   * @param {string} roomCode - Room code
   * @param {string} socketId - Player socket ID
   * @returns {boolean} True if it's player's turn
   */
  isPlayerTurn(roomCode, socketId) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room || !room.gameStarted || room.gameEnded) {
      return false;
    }
    
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    const currentPlayer = playersInRound[room.currentTurnIndex];
    
    return currentPlayer && currentPlayer.socketId === socketId;
  }

  /**
   * Get current player whose turn it is
   * @param {string} roomCode - Room code
   * @returns {Object|null} Current player or null
   */
  getCurrentPlayer(roomCode) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) return null;
    
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    return playersInRound[room.currentTurnIndex] || null;
  }

  /**
   * Get available actions for a player
   * @param {string} roomCode - Room code
   * @param {string} socketId - Player socket ID
   * @returns {Array} Array of available action strings
   */
  getAvailableActions(roomCode, socketId) {
    const room = roomManager.getRoom(roomCode);
    const player = roomManager.getPlayer(roomCode, socketId);
    
    if (!room || !player || !this.isPlayerTurn(roomCode, socketId)) {
      return [];
    }
    
    const actions = [];
    
    // Always can fold
    actions.push('fold');
    
    // Can always go all-in if has points
    if (player.points > 0) {
      actions.push('all-in');
    }
    
    // Can call if there's a bet to match
    if (room.highestBet > player.currentBet) {
      const callAmount = room.highestBet - player.currentBet;
      if (player.points >= callAmount) {
        actions.push('call');
      }
    }
    
    // Can bet if no one has bet yet
    if (room.highestBet === 0 && player.points >= room.currentStake) {
      actions.push('bet');
    }
    
    // Can raise if someone has bet
    if (room.highestBet > 0 && player.points > (room.highestBet - player.currentBet)) {
      actions.push('raise');
    }
    
    return actions;
  }

  /**
   * Validate action and amount
   * @param {string} roomCode - Room code
   * @param {string} socketId - Player socket ID
   * @param {string} action - Action type
   * @param {number} amount - Bet amount (if applicable)
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateAction(roomCode, socketId, action, amount = 0) {
    const room = roomManager.getRoom(roomCode);
    const player = roomManager.getPlayer(roomCode, socketId);
    
    if (!room) {
      return { valid: false, error: 'Room not found' };
    }
    
    if (!player) {
      return { valid: false, error: 'Player not found' };
    }
    
    if (!this.isPlayerTurn(roomCode, socketId)) {
      return { valid: false, error: 'Not your turn' };
    }
    
    if (player.isEliminated || player.hasFolded || player.isAllIn) {
      return { valid: false, error: 'Cannot act in current state' };
    }
    
    const availableActions = this.getAvailableActions(roomCode, socketId);
    
    if (!availableActions.includes(action)) {
      return { valid: false, error: `Action ${action} not available` };
    }
    
    // Validate amounts for bet/raise
    if (action === 'bet') {
      if (amount < room.currentStake) {
        return { valid: false, error: `Minimum bet is ${room.currentStake}` };
      }
      if (amount > player.points) {
        return { valid: false, error: 'Insufficient points' };
      }
    }
    
    if (action === 'raise') {
      if (amount <= room.highestBet) {
        return { valid: false, error: 'Raise must be higher than current bet' };
      }
      const additionalAmount = amount - player.currentBet;
      if (additionalAmount > player.points) {
        return { valid: false, error: 'Insufficient points' };
      }
    }
    
    if (action === 'call') {
      const callAmount = room.highestBet - player.currentBet;
      if (player.points < callAmount) {
        return { valid: false, error: 'Insufficient points to call' };
      }
    }
    
    return { valid: true };
  }

  /**
   * Check if betting round is complete
   * All active players have either:
   * - Matched the highest bet
   * - Folded
   * - Gone all-in
   * @param {string} roomCode - Room code
   * @returns {boolean} True if betting round is complete
   */
  isBettingComplete(roomCode) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) return false;
    
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    
    // Need at least one player
    if (playersInRound.length === 0) return true;
    
    // Only one player left
    if (playersInRound.length === 1) return true;
    
    // Check if all players who can act have matching bets
    const playersWhoCanAct = playersInRound.filter(p => !p.isAllIn);
    
    if (playersWhoCanAct.length === 0) {
      // Everyone is all-in
      return true;
    }
    
    // All active players must have bet equal to highest bet
    const allBetsMatched = playersWhoCanAct.every(p => p.currentBet === room.highestBet);
    
    return allBetsMatched && room.highestBet >= 0;
  }

  /**
   * Get betting summary for current round
   * @param {string} roomCode - Room code
   * @returns {Object} Betting summary
   */
  getBettingSummary(roomCode) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) return null;
    
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    
    return {
      pot: room.pot,
      currentStake: room.currentStake,
      highestBet: room.highestBet,
      playersInRound: playersInRound.length,
      playersAllIn: playersInRound.filter(p => p.isAllIn).length,
      bettingComplete: this.isBettingComplete(roomCode)
    };
  }
}

module.exports = new TurnManager();
