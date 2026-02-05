/**
 * Deck Handler Module
 * Manages card deck creation, shuffling, and dealing
 * Uses standard 52-card deck with unique cards
 */

class DeckHandler {
  constructor() {
    this.suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  }

  /**
   * Create a fresh 52-card deck
   * @returns {Array} Array of card objects
   */
  createDeck() {
    const deck = [];
    
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        deck.push({
          suit,
          rank,
          value: this.getCardValue(rank)
        });
      }
    }
    
    return deck;
  }

  /**
   * Get numeric value for a card rank
   * IGNORES SUITS - only rank matters
   * @param {string} rank - Card rank (2-10, J, Q, K, A)
   * @returns {number} Numeric value
   */
  getCardValue(rank) {
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;
    if (rank === 'A') return 14;
    return parseInt(rank);
  }

  /**
   * Shuffle deck using Fisher-Yates algorithm
   * @param {Array} deck - Array of card objects
   * @returns {Array} Shuffled deck
   */
  shuffleDeck(deck) {
    const shuffled = [...deck];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Deal cards to players
   * Each player gets exactly 2 cards
   * Cards are unique (removed from deck after dealing)
   * @param {Array} deck - Available cards
   * @param {number} playerCount - Number of players to deal to
   * @returns {Object} { hands: Array of 2-card arrays, remainingDeck }
   */
  dealCards(deck, playerCount) {
    const hands = [];
    const deckCopy = [...deck];
    
    // Each player gets 2 cards
    for (let i = 0; i < playerCount; i++) {
      const hand = [
        deckCopy.shift(), // First card
        deckCopy.shift()  // Second card
      ];
      hands.push(hand);
    }
    
    return {
      hands,
      remainingDeck: deckCopy
    };
  }

  /**
   * Calculate hand value (highest card value)
   * Hand strength = highest value among the 2 cards
   * NO pairs, straights, or flushes
   * @param {Array} hand - Array of 2 cards
   * @returns {number} Hand value
   */
  getHandValue(hand) {
    if (!hand || hand.length !== 2) return 0;
    return Math.max(hand[0].value, hand[1].value);
  }

  /**
   * Compare two hands
   * @param {Array} hand1 - First hand
   * @param {Array} hand2 - Second hand
   * @returns {number} 1 if hand1 wins, -1 if hand2 wins, 0 if tie
   */
  compareHands(hand1, hand2) {
    const value1 = this.getHandValue(hand1);
    const value2 = this.getHandValue(hand2);
    
    if (value1 > value2) return 1;
    if (value1 < value2) return -1;
    return 0;
  }
}

module.exports = new DeckHandler();
