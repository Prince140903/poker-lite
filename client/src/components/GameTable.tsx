import { Card as CardType, GameState, ShowdownData } from "../types/game";
import { Card } from "./Card";
import { PlayerList } from "./PlayerList";
import { ActionPanel } from "./ActionPanel";

interface GameTableProps {
  gameState: GameState;
  myCards: CardType[];
  mySocketId: string;
  isSpectating: boolean;
  showdownData: ShowdownData | null;
  onStartNewRound: () => void;
}

export const GameTable = ({
  gameState,
  myCards,
  mySocketId,
  isSpectating,
  showdownData,
  onStartNewRound,
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

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px",
        minHeight: "100vh",
        backgroundColor: "#2c3e50",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            backgroundColor: "#27ae60",
            borderRadius: "12px",
            padding: "30px",
            marginBottom: "20px",
            color: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Room: {gameState.roomCode}</h2>
              <div style={{ fontSize: "14px", marginTop: "5px" }}>
                Round {gameState.roundNumber}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                Pot: {gameState.pot}
              </div>
              <div style={{ fontSize: "14px", marginTop: "5px" }}>
                Stake: {gameState.currentStake}
              </div>
            </div>
          </div>

          {gameState.gameStarted && (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "15px",
                borderRadius: "8px",
                marginTop: "15px",
              }}
            >
              <div style={{ fontSize: "14px", marginBottom: "5px" }}>
                Current Bet: {gameState.highestBet}
              </div>
              <div style={{ fontSize: "14px" }}>
                Turn: {gameState.currentTurn || "Waiting..."}
              </div>
            </div>
          )}
        </div>

        {showdownData && (
          <div
            style={{
              backgroundColor: "#f39c12",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              color: "#fff",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0" }}>Showdown Results</h3>
            <div style={{ marginBottom: "10px" }}>
              Pot: {showdownData.pot} | {showdownData.reason}
            </div>
            {showdownData.winners.map((winner) => (
              <div
                key={winner.id}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "18px" }}>
                  🏆 {winner.name} wins {winner.winAmount}
                </div>
                <div style={{ marginTop: "10px" }}>
                  Hand Value: {winner.handValue}
                </div>
                <div
                  style={{
                    display: "flex",
                    marginTop: "10px",
                    justifyContent: "center",
                  }}
                >
                  {winner.hand.map((card, idx) => (
                    <Card key={idx} card={card} />
                  ))}
                </div>
              </div>
            ))}
            {myPlayer?.isHost && !showdownData.gameEnded && (
              <button
                onClick={onStartNewRound}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#27ae60",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  marginTop: "15px",
                }}
              >
                Start Next Round
              </button>
            )}
          </div>
        )}

        {myCards.length > 0 && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
              Your Cards
            </h3>
            <div style={{ display: "flex", justifyContent: "center" }}>
              {myCards.map((card, idx) => (
                <Card key={idx} card={card} />
              ))}
            </div>
          </div>
        )}

        {isSpectating && (
          <div
            style={{
              backgroundColor: "#e74c3c",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
              color: "#fff",
              textAlign: "center",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            👁️ Spectating
          </div>
        )}

        {!isSpectating && gameState.gameStarted && (
          <ActionPanel
            canAct={!!canAct}
            currentStake={gameState.currentStake}
            highestBet={gameState.highestBet}
            myCurrentBet={myPlayer?.currentBet || 0}
            myPoints={myPlayer?.points || 0}
          />
        )}
      </div>

      <PlayerList
        players={gameState.players}
        currentTurnSocketId={gameState.currentTurnSocketId}
        mySocketId={mySocketId}
      />
    </div>
  );
};
