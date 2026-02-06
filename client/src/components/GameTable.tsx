import { Card as CardType, GameState, ShowdownData } from "../types/game";
import { Card } from "./Card";
import { ActionPanel } from "./ActionPanel";

interface GameTableProps {
  gameState: GameState;
  myCards: CardType[];
  mySocketId: string;
  isSpectating: boolean;
  showdownData: ShowdownData | null;
  onStartNewRound: () => void;
  turnTimer: { playerId: string; timeRemaining: number } | null;
}

export const GameTable = ({
  gameState,
  myCards,
  mySocketId,
  isSpectating,
  showdownData,
  onStartNewRound,
  turnTimer,
}: GameTableProps) => {
  const myPlayer = gameState.players.find((p) => p.socketId === mySocketId);
  const isMyTurn = gameState.currentTurnSocketId === mySocketId;
  const canAct =
    isMyTurn &&
    !isSpectating &&
    myPlayer &&
    !myPlayer.hasFolded &&
    !myPlayer.isAllIn &&
    !myPlayer.isEliminated;

  // Debug turn detection
  console.log("GameTable Turn Detection:", {
    mySocketId,
    currentTurnSocketId: gameState.currentTurnSocketId,
    currentTurn: gameState.currentTurn,
    isMyTurn,
    myPlayer: myPlayer ? { name: myPlayer.name, socketId: myPlayer.socketId } : null,
    canAct,
    isSpectating,
    hasFolded: myPlayer?.hasFolded,
    isAllIn: myPlayer?.isAllIn,
    isEliminated: myPlayer?.isEliminated
  });

  // Calculate player positions around the table
  const getPlayerPosition = (index: number, total: number) => {
    // Position players in a circle around the table
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2; // Start from top
    const radiusX = 40; // Horizontal radius percentage
    const radiusY = 35; // Vertical radius percentage
    
    const x = 50 + radiusX * Math.cos(angle);
    const y = 50 + radiusY * Math.sin(angle);
    
    return { x, y, angle };
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
          }
        `}
      </style>
      <div
        style={{
          position: "relative",
          minHeight: "100vh",
          backgroundColor: "#1a1a2e",
          padding: "20px",
          overflow: "hidden",
        }}
      >
      {/* Room Header */}
      <div
        style={{
          position: "absolute",
          top: "clamp(10px, 2vh, 20px)",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div style={{ color: "#fff", fontSize: "clamp(16px, 3vw, 20px)", fontWeight: "bold" }}>
          Room: {gameState.roomCode}
        </div>
        <div style={{ color: "#bbb", fontSize: "clamp(12px, 2vw, 14px)", marginTop: "5px" }}>
          Round {gameState.roundNumber} | Stake: {gameState.currentStake}
        </div>
      </div>

      {/* Poker Table */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(90vw, 1000px)",
          height: "min(70vh, 600px)",
          background: "linear-gradient(135deg, #1e7e34 0%, #28a745 100%)",
          borderRadius: "50%",
          border: "20px solid #8b4513",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), inset 0 0 100px rgba(0,0,0,0.3)",
        }}
      >
        {/* Table Inner Border */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "30px",
            right: "30px",
            bottom: "30px",
            border: "3px solid rgba(255,255,255,0.1)",
            borderRadius: "50%",
          }}
        />

        {/* Pot Display - Center of Table */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0,0,0,0.3)",
            padding: "20px 30px",
            borderRadius: "50px",
            border: "3px solid rgba(255,215,0,0.5)",
            textAlign: "center",
            minWidth: "150px",
          }}
        >
          <div style={{ color: "#ffd700", fontSize: "14px", fontWeight: "bold" }}>
            POT
          </div>
          <div style={{ color: "#fff", fontSize: "32px", fontWeight: "bold", marginTop: "5px" }}>
            {gameState.pot}
          </div>
          <div style={{ color: "#bbb", fontSize: "12px", marginTop: "5px" }}>
            Current Bet: {gameState.highestBet}
          </div>
        </div>

        {/* Players positioned around the table */}
        {gameState.players.map((player, index) => {
          const pos = getPlayerPosition(index, gameState.players.length);
          const isMe = player.socketId === mySocketId;
          const isCurrentTurn = gameState.currentTurnSocketId === player.socketId;
          
          return (
            <div
              key={player.id}
              style={{
                position: "absolute",
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: isMe ? 100 : 1,
              }}
            >
              {/* Player Card */}
              <div
                className="player-card"
                style={{
                  backgroundColor: isCurrentTurn 
                    ? "#ffc107" 
                    : isMe 
                    ? "#3498db" 
                    : player.hasFolded 
                    ? "#95a5a6" 
                    : "#2c3e50",
                  borderRadius: "15px",
                  padding: "clamp(10px, 2vw, 15px)",
                  minWidth: "clamp(120px, 15vw, 140px)",
                  border: isCurrentTurn 
                    ? "4px solid #ff9800" 
                    : isMe 
                    ? "4px solid #2980b9" 
                    : "3px solid rgba(255,255,255,0.2)",
                  boxShadow: isCurrentTurn 
                    ? "0 0 30px rgba(255,193,7,0.8)" 
                    : "0 10px 30px rgba(0,0,0,0.4)",
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  opacity: player.hasFolded || player.isEliminated ? 0.6 : 1,
                }}
              >
                {/* Player Name */}
                <div
                  style={{
                    color: "#fff",
                    fontSize: "clamp(12px, 2vw, 16px)",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                  }}
                >
                  {player.isHost && "👑"}
                  {player.name}
                  {isMe && " (You)"}
                </div>

                {/* Points */}
                <div
                  style={{
                    color: isCurrentTurn ? "#000" : "#ffd700",
                    fontSize: "clamp(16px, 3vw, 20px)",
                    fontWeight: "bold",
                    marginBottom: "5px",
                  }}
                >
                  {player.points} pts
                </div>

                {/* Current Bet */}
                {player.currentBet > 0 && (
                  <div
                    style={{
                      color: isCurrentTurn ? "#000" : "#fff",
                      fontSize: "clamp(10px, 1.5vw, 12px)",
                      opacity: 0.9,
                    }}
                  >
                    Bet: {player.currentBet}
                  </div>
                )}

                {/* Player's Cards - Show backs unless folded or it's me */}
                {!player.isEliminated && (
                  <div style={{ display: "flex", gap: "3px", justifyContent: "center", marginTop: "8px" }}>
                    {player.hasFolded && player.cards && player.cards.length > 0 ? (
                      // Show actual cards when folded
                      player.cards.map((card, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: "clamp(25px, 4vw, 35px)",
                            height: "clamp(35px, 6vw, 50px)",
                            backgroundColor: "#fff",
                            borderRadius: "4px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "clamp(10px, 1.5vw, 14px)",
                            fontWeight: "bold",
                            border: "1px solid #ddd",
                            color: card.suit === "♥" || card.suit === "♦" ? "#e74c3c" : "#000",
                          }}
                        >
                          <div>{card.rank}</div>
                          <div style={{ fontSize: "clamp(8px, 1.2vw, 12px)" }}>{card.suit}</div>
                        </div>
                      ))
                    ) : !isMe && gameState.gameStarted ? (
                      // Show card backs for other players who haven't folded
                      [1, 2].map((_, idx) => (
                        <div
                          key={idx}
                          style={{
                            width: "clamp(25px, 4vw, 35px)",
                            height: "clamp(35px, 6vw, 50px)",
                            backgroundColor: "#c0392b",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "clamp(16px, 3vw, 24px)",
                            border: "2px solid #922b21",
                            boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)",
                            background: "linear-gradient(135deg, #c0392b 0%, #922b21 100%)",
                          }}
                        >
                          <div style={{ color: "#fff", opacity: 0.3 }}>🂠</div>
                        </div>
                      ))
                    ) : null}
                  </div>
                )}

                {/* Status Indicators */}
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  {player.hasFolded && (
                    <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                      FOLDED
                    </span>
                  )}
                  {player.isAllIn && (
                    <span style={{ color: "#f39c12", fontWeight: "bold" }}>
                      ALL-IN
                    </span>
                  )}
                  {player.isEliminated && (
                    <span style={{ color: "#e74c3c", fontWeight: "bold" }}>
                      ELIMINATED
                    </span>
                  )}
                  {isCurrentTurn && !player.hasFolded && !player.isEliminated && (
                    <div>
                      <span style={{ color: isMe ? "#fff" : "#000", fontWeight: "bold" }}>
                        ⏰ TURN
                      </span>
                      {turnTimer && turnTimer.playerId === player.id && (
                        <div style={{
                          marginTop: "5px",
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: turnTimer.timeRemaining <= 10 
                            ? "#e74c3c" 
                            : isMe ? "#fff" : "#000",
                          animation: turnTimer.timeRemaining <= 5 ? "pulse 1s infinite" : "none",
                        }}>
                          {turnTimer.timeRemaining}s
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* My Cards Display - Bottom Center */}
      {myCards.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: "clamp(10px, 2vh, 20px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(44, 62, 80, 0.95)",
            borderRadius: "15px",
            padding: "clamp(15px, 2vw, 20px)",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
            border: "3px solid #3498db",
            maxWidth: "90vw",
          }}
        >
          <div
            style={{
              color: "#fff",
              fontSize: "clamp(12px, 2vw, 14px)",
              fontWeight: "bold",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            Your Cards
          </div>
          <div
            style={{
              display: "flex",
              gap: "clamp(8px, 1.5vw, 10px)",
              justifyContent: "center",
            }}
          >
            {myCards.map((card, idx) => (
              <Card key={idx} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Action Panel - Bottom Right */}
      {!isSpectating && gameState.gameStarted && !showdownData && (
        <div
          className="action-panel"
          style={{
            position: "fixed",
            bottom: "clamp(10px, 2vh, 20px)",
            right: "clamp(10px, 2vw, 20px)",
            zIndex: 200,
          }}
        >
          <ActionPanel
            canAct={!!canAct}
            currentStake={gameState.currentStake}
            highestBet={gameState.highestBet}
            myCurrentBet={myPlayer?.currentBet || 0}
            myPoints={myPlayer?.points || 0}
          />
        </div>
      )}

      {/* Showdown Results Overlay */}
      {showdownData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#2c3e50",
              borderRadius: "20px",
              padding: "30px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                margin: "0 0 25px 0",
                textAlign: "center",
                fontSize: "28px",
                color: "#fff",
              }}
            >
              🎲 Round {showdownData.roundNumber} Results
            </h3>

            {/* Winner(s) Display */}
            {showdownData.winners.map((winner) => {
              const isMe = winner.id === myPlayer?.id;
              return (
                <div
                  key={winner.id}
                  style={{
                    background: isMe
                      ? "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)"
                      : "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)",
                    padding: "25px",
                    borderRadius: "15px",
                    marginBottom: "20px",
                    textAlign: "center",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: "26px",
                      marginBottom: "15px",
                      color: "#fff",
                      textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    🏆 {isMe ? "VICTORY!" : `${winner.name} Wins!`}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      marginBottom: "15px",
                      color: "#fff",
                      fontWeight: "bold",
                    }}
                  >
                    Won: +{winner.winAmount} points
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginTop: "15px",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {winner.hand.map((card, idx) => (
                      <div
                        key={idx}
                        style={{
                          transform: "scale(1.1)",
                        }}
                      >
                        <Card card={card} />
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: "15px",
                      fontSize: "16px",
                      color: "#fff",
                      opacity: 0.9,
                    }}
                  >
                    Hand Value: {winner.handValue}
                  </div>
                </div>
              );
            })}

            {/* All Players Status */}
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "20px",
                borderRadius: "12px",
                marginTop: "25px",
              }}
            >
              <h4
                style={{
                  margin: "0 0 15px 0",
                  textAlign: "center",
                  color: "#fff",
                  fontSize: "18px",
                }}
              >
                Player Status
              </h4>
              {showdownData.playersState.map((player) => {
                const isWinner = showdownData.winners.some(
                  (w) => w.id === player.id
                );
                const isMe = player.id === myPlayer?.id;
                const winAmount = isWinner
                  ? showdownData.winners.find((w) => w.id === player.id)
                      ?.winAmount || 0
                  : 0;

                return (
                  <div
                    key={player.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 15px",
                      marginBottom: "10px",
                      backgroundColor: isMe
                        ? "rgba(52, 152, 219, 0.4)"
                        : "rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      borderLeft: isWinner
                        ? "5px solid #27ae60"
                        : player.isEliminated
                        ? "5px solid #e74c3c"
                        : "5px solid transparent",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: "bold", color: "#fff" }}>
                        {player.name}
                        {isMe ? " (You)" : ""}
                      </span>
                      {player.isEliminated && (
                        <span
                          style={{
                            color: "#e74c3c",
                            marginLeft: "10px",
                            fontSize: "12px",
                          }}
                        >
                          ELIMINATED
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#fff",
                        }}
                      >
                        {player.points} pts
                      </div>
                      {isWinner && (
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#2ecc71",
                            fontWeight: "bold",
                          }}
                        >
                          +{winAmount}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                fontSize: "14px",
                color: "#bbb",
              }}
            >
              Pot: {showdownData.pot} | {showdownData.reason}
            </div>

            {myPlayer?.isHost && !showdownData.gameEnded && (
              <button
                onClick={onStartNewRound}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: "#3498db",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginTop: "25px",
                  boxShadow: "0 5px 15px rgba(52, 152, 219, 0.4)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#2980b9";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#3498db";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Start Next Round →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Spectating Indicator */}
      {isSpectating && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#e74c3c",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "25px",
            fontWeight: "bold",
            boxShadow: "0 5px 15px rgba(231, 76, 60, 0.4)",
            zIndex: 10,
          }}
        >
          👁️ Spectating Mode
        </div>
      )}
    </div>
    </>
  );
};
