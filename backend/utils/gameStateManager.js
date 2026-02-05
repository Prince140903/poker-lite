/**
 * Game State Manager
 * Manages game rounds, pot, stakes, and round progression
 * Handles win conditions and game ending logic
 */

const deckHandler = require('./deckHandler');
const roomManager = require('./roomManager');

class GameStateManager {
  /**
   * Start a new game
   * @param {string} roomCode - Room code
   * @returns {Object} Game state
   */
  startGame(roomCode) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }
    
    if (!roomManager.canStartGame(roomCode)) {
      return { error: 'Cannot start game - need at least 2 players' };
    }
    
    // Initialize game state
    room.gameStarted = true;
    room.gameEnded = false;
    room.roundNumber = 0;
    room.currentStake = room.initialStake;
    
    // Start first round
    return this.startNewRound(roomCode);
  }

  /**
   * Start a new round
   * @param {string} roomCode - Room code
   * @returns {Object} Round state
   */
  startNewRound(roomCode) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }
    
    // Increment round number
    room.roundNumber++;
    
    // Update stake every 5 rounds
    if (room.roundNumber > 1 && (room.roundNumber - 1) % 5 === 0) {
      room.currentStake = room.currentStake * 2;
    }
    
    // Reset round state for all players
    const activePlayers = roomManager.getActivePlayers(roomCode);
    
    activePlayers.forEach(player => {
      player.cards = [];
      player.currentBet = 0;
      player.hasFolded = false;
      player.isAllIn = false;
    });
    
    // Check for eliminated players (points = 0)
    room.players.forEach(player => {
      if (player.points <= 0 && !player.isEliminated) {
        player.isEliminated = true;
        player.isSpectator = true;
      }
    });
    
    // Check if game should end (only 1 active player left)
    const remainingActivePlayers = roomManager.getActivePlayers(roomCode);
    if (remainingActivePlayers.length <= 1) {
      return this.endGame(roomCode);
    }
    
    // Initialize pot
    room.pot = 0;
    room.currentTurnIndex = 0;
    room.roundPhase = 'betting'; // betting, showdown, ended
    room.highestBet = 0;
    
    // Create and shuffle deck
    const deck = deckHandler.createDeck();
    const shuffledDeck = deckHandler.shuffleDeck(deck);
    
    // Deal cards to active players only
    const { hands, remainingDeck } = deckHandler.dealCards(
      shuffledDeck,
      remainingActivePlayers.length
    );
    
    // Assign cards to players
    remainingActivePlayers.forEach((player, index) => {
      player.cards = hands[index];
    });
    
    room.deck = remainingDeck;
    
    return {
      roomCode,
      roundNumber: room.roundNumber,
      currentStake: room.currentStake,
      pot: room.pot,
      activePlayers: remainingActivePlayers.length,
      currentTurnIndex: room.currentTurnIndex
    };
  }

  /**
   * Process player action (bet, call, raise, fold, all-in)
   * @param {string} roomCode - Room code
   * @param {string} socketId - Player socket ID
   * @param {string} action - Action type
   * @param {number} amount - Bet/raise amount (optional)
   * @returns {Object} Action result
   */
  processPlayerAction(roomCode, socketId, action, amount = 0) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }
    
    const player = roomManager.getPlayer(roomCode, socketId);
    
    if (!player) {
      return { error: 'Player not found' };
    }
    
    // Validate it's player's turn
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    const currentPlayer = playersInRound[room.currentTurnIndex];
    
    if (!currentPlayer || currentPlayer.socketId !== socketId) {
      return { error: 'Not your turn' };
    }
    
    // Player cannot act if eliminated, folded, or all-in
    if (player.isEliminated || player.hasFolded || player.isAllIn) {
      return { error: 'Cannot act in current state' };
    }
    
    let actionResult = {};
    
    switch (action) {
      case 'fold':
        actionResult = this.handleFold(room, player);
        break;
        
      case 'call':
        actionResult = this.handleCall(room, player);
        break;
        
      case 'bet':
        actionResult = this.handleBet(room, player, amount);
        break;
        
      case 'raise':
        actionResult = this.handleRaise(room, player, amount);
        break;
        
      case 'all-in':
        actionResult = this.handleAllIn(room, player);
        break;
        
      default:
        return { error: 'Invalid action' };
    }
    
    if (actionResult.error) {
      return actionResult;
    }
    
    // Check if round should end
    const roundEndCheck = this.checkRoundEnd(roomCode);
    
    if (roundEndCheck.shouldEnd) {
      return this.endRound(roomCode);
    }
    
    // Move to next turn
    this.moveToNextTurn(room);
    
    return {
      success: true,
      action,
      player: player.name,
      pot: room.pot,
      currentTurnIndex: room.currentTurnIndex,
      ...actionResult
    };
  }

  /**
   * Handle fold action
   */
  handleFold(room, player) {
    player.hasFolded = true;
    
    // Player loses the stake
    const stakeLoss = Math.min(room.currentStake, player.points);
    player.points -= stakeLoss;
    room.pot += stakeLoss;
    
    return { stakeLoss };
  }

  /**
   * Handle call action
   */
  handleCall(room, player) {
    const callAmount = room.highestBet - player.currentBet;
    
    if (player.points < callAmount) {
      // Not enough points - must go all-in or fold
      return { error: 'Insufficient points - go all-in or fold' };
    }
    
    player.points -= callAmount;
    player.currentBet += callAmount;
    room.pot += callAmount;
    
    return { betAmount: callAmount };
  }

  /**
   * Handle bet action
   */
  handleBet(room, player, amount) {
    // First bet of the round
    if (room.highestBet > 0) {
      return { error: 'Use raise instead - bet already placed' };
    }
    
    if (amount < room.currentStake) {
      return { error: `Minimum bet is ${room.currentStake}` };
    }
    
    if (player.points < amount) {
      return { error: 'Insufficient points' };
    }
    
    player.points -= amount;
    player.currentBet = amount;
    room.highestBet = amount;
    room.pot += amount;
    
    return { betAmount: amount };
  }

  /**
   * Handle raise action
   */
  handleRaise(room, player, amount) {
    const totalBet = amount;
    
    if (totalBet <= room.highestBet) {
      return { error: 'Raise must be higher than current bet' };
    }
    
    const additionalAmount = totalBet - player.currentBet;
    
    if (player.points < additionalAmount) {
      return { error: 'Insufficient points' };
    }
    
    player.points -= additionalAmount;
    player.currentBet = totalBet;
    room.highestBet = totalBet;
    room.pot += additionalAmount;
    
    return { betAmount: totalBet };
  }

  /**
   * Handle all-in action
   */
  handleAllIn(room, player) {
    const allInAmount = player.points;
    
    if (allInAmount === 0) {
      return { error: 'No points to go all-in' };
    }
    
    player.currentBet += allInAmount;
    room.pot += allInAmount;
    player.points = 0;
    player.isAllIn = true;
    
    // Update highest bet if applicable
    if (player.currentBet > room.highestBet) {
      room.highestBet = player.currentBet;
    }
    
    return { betAmount: allInAmount };
  }

  /**
   * Move to next player's turn
   */
  moveToNextTurn(room) {
    const playersInRound = roomManager.getPlayersInRound(room.code);
    
    // Find next player who can act (not folded, not all-in)
    let attempts = 0;
    const maxAttempts = playersInRound.length;
    
    do {
      room.currentTurnIndex = (room.currentTurnIndex + 1) % playersInRound.length;
      attempts++;
      
      const nextPlayer = playersInRound[room.currentTurnIndex];
      
      // Player can act if not all-in
      if (!nextPlayer.isAllIn) {
        break;
      }
      
    } while (attempts < maxAttempts);
  }

  /**
   * Check if round should end
   */
  checkRoundEnd(roomCode) {
    const room = roomManager.getRoom(roomCode);
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    
    // Only one player left (others folded)
    if (playersInRound.length === 1) {
      return { shouldEnd: true, reason: 'single_player' };
    }
    
    // All players have acted and bets are equal
    const playersWhoCanAct = playersInRound.filter(p => !p.isAllIn);
    
    if (playersWhoCanAct.length === 0) {
      // All remaining players are all-in -> showdown
      return { shouldEnd: true, reason: 'all_in' };
    }
    
    // Check if all active players have matching bets
    const allBetsEqual = playersWhoCanAct.every(p => p.currentBet === room.highestBet);
    
    if (allBetsEqual && room.highestBet > 0) {
      return { shouldEnd: true, reason: 'betting_complete' };
    }
    
    return { shouldEnd: false };
  }

  /**
   * End current round and determine winner(s)
   */
  endRound(roomCode) {
    const room = roomManager.getRoom(roomCode);
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    
    let winners = [];
    let winReason = '';
    
    // Case 1: Only one player left (others folded)
    if (playersInRound.length === 1) {
      winners = [playersInRound[0]];
      winReason = 'All others folded';
    } else {
      // Case 2: Showdown - compare hands
      winReason = 'Showdown';
      
      let highestValue = 0;
      let topPlayers = [];
      
      playersInRound.forEach(player => {
        const handValue = deckHandler.getHandValue(player.cards);
        
        if (handValue > highestValue) {
          highestValue = handValue;
          topPlayers = [player];
        } else if (handValue === highestValue) {
          topPlayers.push(player);
        }
      });
      
      winners = topPlayers;
    }
    
    // Distribute pot
    const winAmount = Math.floor(room.pot / winners.length);
    
    winners.forEach(winner => {
      winner.points += winAmount;
    });
    
    // Prepare round end data
    const roundEndData = {
      roundNumber: room.roundNumber,
      winners: winners.map(w => ({
        id: w.id,
        name: w.name,
        winAmount,
        hand: w.cards,
        handValue: deckHandler.getHandValue(w.cards)
      })),
      pot: room.pot,
      reason: winReason,
      playersState: room.players.map(p => ({
        id: p.id,
        name: p.name,
        points: p.points,
        isEliminated: p.isEliminated
      }))
    };
    
    room.pot = 0;
    
    // Check if game should end
    const activePlayers = roomManager.getActivePlayers(roomCode);
    if (activePlayers.length <= 1) {
      room.gameEnded = true;
      roundEndData.gameEnded = true;
      roundEndData.gameWinner = activePlayers[0] || null;
    }
    
    return roundEndData;
  }

  /**
   * End the entire game
   */
  endGame(roomCode) {
    const room = roomManager.getRoom(roomCode);
    const activePlayers = roomManager.getActivePlayers(roomCode);
    
    room.gameEnded = true;
    
    return {
      gameEnded: true,
      winner: activePlayers[0] || null,
      finalStandings: room.players
        .sort((a, b) => b.points - a.points)
        .map(p => ({
          id: p.id,
          name: p.name,
          points: p.points,
          isEliminated: p.isEliminated
        }))
    };
  }

  /**
   * Get current game state for a room
   */
  getGameState(roomCode) {
    const room = roomManager.getRoom(roomCode);
    
    if (!room) {
      return { error: 'Room not found' };
    }
    
    const playersInRound = roomManager.getPlayersInRound(roomCode);
    const currentPlayer = playersInRound[room.currentTurnIndex] || null;
    
    return {
      roomCode: room.code,
      gameStarted: room.gameStarted,
      gameEnded: room.gameEnded,
      roundNumber: room.roundNumber,
      currentStake: room.currentStake,
      pot: room.pot,
      highestBet: room.highestBet,
      currentTurn: currentPlayer ? currentPlayer.name : null,
      currentTurnSocketId: currentPlayer ? currentPlayer.socketId : null,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        points: p.points,
        currentBet: p.currentBet,
        hasFolded: p.hasFolded,
        isAllIn: p.isAllIn,
        isEliminated: p.isEliminated,
        isSpectator: p.isSpectator,
        isHost: p.isHost,
        // Hide cards from other players
        hasCards: p.cards.length > 0
      }))
    };
  }
}

module.exports = new GameStateManager();
