import { Player } from "../types/game";

interface PlayerListProps {
  players: Player[];
  currentTurnSocketId: string | null;
  mySocketId: string;
}

export const PlayerList = ({
  players,
  currentTurnSocketId,
  mySocketId,
}: PlayerListProps) => {
  // Find the player by comparing all fields since socketId might not be set correctly
  const findMyPlayer = () => {
    return players.find(p => p.socketId === mySocketId);
  };

  return (
    <div
      style={{
        border: "1px solid #34495e",
        borderRadius: "8px",
        padding: "15px",
        backgroundColor: "#ecf0f1",
        minWidth: "250px",
      }}
    >
      <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Players</h3>
      {players.map((player) => {
        const isMyTurn = player.socketId === currentTurnSocketId;
        const myPlayer = findMyPlayer();
        const isMe = player.id === myPlayer?.id || player.socketId === mySocketId;

        return (
          <div
            key={player.id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              backgroundColor: isMyTurn ? "#3498db" : "#fff",
              border: isMe ? "2px solid #e74c3c" : "1px solid #bdc3c7",
              borderRadius: "6px",
              color: isMyTurn ? "#fff" : "#2c3e50",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                {player.name}
                {isMe && " (You)"}
                {player.isHost && " 👑"}
              </span>
              {isMyTurn && <span>▶</span>}
            </div>
            <div style={{ fontSize: "14px", marginTop: "5px" }}>
              Points: {player.points}
            </div>
            {player.currentBet > 0 && (
              <div style={{ fontSize: "12px", marginTop: "3px" }}>
                Bet: {player.currentBet}
              </div>
            )}
            {player.isEliminated && (
              <div
                style={{
                  fontSize: "12px",
                  color: isMyTurn ? "#fff" : "#e74c3c",
                  marginTop: "3px",
                }}
              >
                ❌ Eliminated
              </div>
            )}
            {player.hasFolded && (
              <div
                style={{
                  fontSize: "12px",
                  color: isMyTurn ? "#fff" : "#95a5a6",
                  marginTop: "3px",
                }}
              >
                Folded
              </div>
            )}
            {player.isAllIn && (
              <div
                style={{
                  fontSize: "12px",
                  color: isMyTurn ? "#fff" : "#f39c12",
                  marginTop: "3px",
                }}
              >
                🔥 All-in
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
