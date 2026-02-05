/**
 * Example Test Client
 * Simple test script to verify server functionality
 * Run with: node examples/testClient.js
 */

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';

// Test configuration
const TEST_PLAYERS = [
  { name: 'Alice', socket: null },
  { name: 'Bob', socket: null },
  { name: 'Charlie', socket: null }
];

let roomCode = null;
let gameState = {};

console.log('🧪 Starting Poker Lite Test Client...\n');

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test flow
async function runTest() {
  try {
    // Step 1: Connect all players
    console.log('📡 Connecting players...');
    for (const player of TEST_PLAYERS) {
      player.socket = io(SERVER_URL);
      await new Promise((resolve) => {
        player.socket.on('connect', () => {
          console.log(`✅ ${player.name} connected (${player.socket.id})`);
          resolve();
        });
      });
    }
    
    await wait(500);
    
    // Step 2: Alice creates room
    console.log('\n🏠 Alice creating room...');
    await new Promise((resolve) => {
      TEST_PLAYERS[0].socket.emit('CREATE_ROOM', {
        playerName: 'Alice',
        initialStake: 50
      }, (response) => {
        if (response.success) {
          roomCode = response.roomCode;
          console.log(`✅ Room created: ${roomCode}`);
          console.log(`   Players: ${response.room.players.length}`);
        } else {
          console.error('❌ Failed to create room:', response.error);
        }
        resolve();
      });
    });
    
    await wait(500);
    
    // Step 3: Bob and Charlie join
    console.log('\n👥 Other players joining...');
    for (let i = 1; i < TEST_PLAYERS.length; i++) {
      await new Promise((resolve) => {
        TEST_PLAYERS[i].socket.emit('JOIN_ROOM', {
          roomCode: roomCode,
          playerName: TEST_PLAYERS[i].name
        }, (response) => {
          if (response.success) {
            console.log(`✅ ${TEST_PLAYERS[i].name} joined room`);
            console.log(`   Total players: ${response.room.players.length}`);
          } else {
            console.error(`❌ ${TEST_PLAYERS[i].name} failed to join:`, response.error);
          }
          resolve();
        });
      });
      await wait(300);
    }
    
    // Set up event listeners
    TEST_PLAYERS.forEach((player, index) => {
      player.socket.on('GAME_STARTED', (data) => {
        console.log(`\n🎮 [${player.name}] Game started!`);
        console.log(`   Round: ${data.roundNumber}`);
        console.log(`   Stake: ${data.currentStake}`);
      });
      
      player.socket.on('DEAL_CARDS', (data) => {
        console.log(`\n🎴 [${player.name}] Cards dealt:`);
        data.cards.forEach(card => {
          console.log(`   ${card.rank} of ${card.suit} (value: ${card.value})`);
        });
      });
      
      player.socket.on('GAME_STATE_UPDATE', (data) => {
        gameState = data;
        if (index === 0) { // Only log from Alice to avoid spam
          console.log(`\n📊 Game State Update:`);
          console.log(`   Round: ${data.roundNumber}`);
          console.log(`   Pot: ${data.pot}`);
          console.log(`   Current Turn: ${data.currentTurn || 'N/A'}`);
        }
      });
      
      player.socket.on('PLAYER_ACTION_RESULT', (data) => {
        console.log(`\n🎯 [${data.playerName}] performed ${data.action.toUpperCase()}`);
        if (data.amount) {
          console.log(`   Amount: ${data.amount}`);
        }
        console.log(`   Pot: ${data.pot}`);
      });
      
      player.socket.on('SHOWDOWN', (data) => {
        console.log(`\n🏆 SHOWDOWN - Round ${data.roundNumber}!`);
        console.log(`   Pot: ${data.pot}`);
        console.log(`   Winner(s):`);
        data.winners.forEach(winner => {
          console.log(`     ${winner.name} - Hand Value: ${winner.handValue} - Won: ${winner.winAmount}`);
          console.log(`       Cards: ${winner.hand.map(c => `${c.rank}${c.suit[0]}`).join(', ')}`);
        });
      });
      
      player.socket.on('GAME_END', (data) => {
        console.log(`\n🎊 GAME OVER!`);
        if (data.winner) {
          console.log(`   Winner: ${data.winner.name}`);
        }
        console.log(`   Final Standings:`);
        data.finalStandings.forEach((player, idx) => {
          console.log(`     ${idx + 1}. ${player.name} - ${player.points} points`);
        });
      });
    });
    
    await wait(1000);
    
    // Step 4: Start game
    console.log('\n🚀 Alice starting game...');
    await new Promise((resolve) => {
      TEST_PLAYERS[0].socket.emit('START_GAME', {}, (response) => {
        if (response.success) {
          console.log('✅ Game started successfully');
        } else {
          console.error('❌ Failed to start game:', response.error);
        }
        resolve();
      });
    });
    
    await wait(2000);
    
    // Step 5: Simulate some betting actions
    console.log('\n💰 Starting betting phase...');
    
    // Alice bets
    await wait(1000);
    console.log('\n👉 Alice\'s turn...');
    await new Promise((resolve) => {
      TEST_PLAYERS[0].socket.emit('PLAYER_ACTION', {
        action: 'bet',
        amount: 50
      }, (response) => {
        if (response.success) {
          console.log('✅ Alice placed bet');
        } else {
          console.error('❌ Alice bet failed:', response.error);
        }
        resolve();
      });
    });
    
    await wait(1500);
    
    // Bob calls
    console.log('\n👉 Bob\'s turn...');
    await new Promise((resolve) => {
      TEST_PLAYERS[1].socket.emit('PLAYER_ACTION', {
        action: 'call'
      }, (response) => {
        if (response.success) {
          console.log('✅ Bob called');
        } else {
          console.error('❌ Bob call failed:', response.error);
        }
        resolve();
      });
    });
    
    await wait(1500);
    
    // Charlie raises
    console.log('\n👉 Charlie\'s turn...');
    await new Promise((resolve) => {
      TEST_PLAYERS[2].socket.emit('PLAYER_ACTION', {
        action: 'raise',
        amount: 100
      }, (response) => {
        if (response.success) {
          console.log('✅ Charlie raised');
        } else {
          console.error('❌ Charlie raise failed:', response.error);
        }
        resolve();
      });
    });
    
    await wait(1500);
    
    // Alice calls the raise
    console.log('\n👉 Alice\'s turn (calling raise)...');
    await new Promise((resolve) => {
      TEST_PLAYERS[0].socket.emit('PLAYER_ACTION', {
        action: 'call'
      }, (response) => {
        if (response.success) {
          console.log('✅ Alice called');
        } else {
          console.error('❌ Alice call failed:', response.error);
        }
        resolve();
      });
    });
    
    await wait(1500);
    
    // Bob calls the raise
    console.log('\n👉 Bob\'s turn (calling raise)...');
    await new Promise((resolve) => {
      TEST_PLAYERS[1].socket.emit('PLAYER_ACTION', {
        action: 'call'
      }, (response) => {
        if (response.success) {
          console.log('✅ Bob called');
        } else {
          console.error('❌ Bob call failed:', response.error);
        }
        resolve();
      });
    });
    
    await wait(2000);
    
    // Step 6: Trigger showdown
    console.log('\n🎭 Requesting showdown...');
    await new Promise((resolve) => {
      TEST_PLAYERS[0].socket.emit('REQUEST_SHOWDOWN', {}, (response) => {
        if (response.success) {
          console.log('✅ Showdown triggered');
        } else {
          console.error('❌ Showdown failed:', response.error);
        }
        resolve();
      });
    });
    
    await wait(3000);
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n💡 Tip: Check the output above for game flow and events');
    console.log('💡 You can now test with a React frontend client!');
    
    // Clean up
    console.log('\n🧹 Disconnecting players...');
    TEST_PLAYERS.forEach(player => {
      player.socket.disconnect();
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
