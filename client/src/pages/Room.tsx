import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket/socket";
import { Card, GameState, ShowdownData, GameEndData } from "../types/game";
import { GameTable } from "../components/GameTable";

export const Room = () => {
  const navigate = useNavigate();
  const socket = getSocket();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [mySocketId, setMySocketId] = useState<string>("");
  const [showdownData, setShowdownData] = useState<ShowdownData | null>(null);
  const [gameEndData, setGameEndData] = useState<GameEndData | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (socket.connected) {
      setMySocketId(socket.id || "");
    }

    socket.on("connect", () => {
      setMySocketId(socket.id || "");
    });

    socket.on("ROOM_UPDATED", (data: any) => {
      if (data.room) {
        setGameState((prev) => ({
          ...prev,
          roomCode: data.room.code,
          players: data.room.players,
          gameStarted: data.room.gameStarted,
          gameEnded: false,
          roundNumber: 0,
          currentStake: 0,
          pot: 0,
          highestBet: 0,
          currentTurn: null,
          currentTurnSocketId: null,
        }));
      }
    });

    socket.on("PLAYER_JOINED", (data: any) => {
      if (data.room) {
        setGameState((prev) => ({
          ...prev,
          roomCode: data.room.code,
          players: data.room.players,
          gameStarted: data.room.gameStarted,
          gameEnded: false,
          roundNumber: prev?.roundNumber || 0,
          currentStake: prev?.currentStake || 0,
          pot: prev?.pot || 0,
          highestBet: prev?.highestBet || 0,
          currentTurn: prev?.currentTurn || null,
          currentTurnSocketId: prev?.currentTurnSocketId || null,
        }));
      }
    });

    socket.on("PLAYER_LEFT", (data: any) => {
      if (data.room) {
        setGameState((prev) => ({
          ...prev,
          roomCode: data.room.code,
          players: data.room.players,
          gameStarted: data.room.gameStarted,
          gameEnded: false,
          roundNumber: prev?.roundNumber || 0,
          currentStake: prev?.currentStake || 0,
          pot: prev?.pot || 0,
          highestBet: prev?.highestBet || 0,
          currentTurn: prev?.currentTurn || null,
          currentTurnSocketId: prev?.currentTurnSocketId || null,
        }));
      }
    });

    socket.on("PLAYER_DISCONNECTED", (data: any) => {
      if (data.room) {
        setGameState((prev) => ({
          ...prev,
          roomCode: data.room.code,
          players: data.room.players,
          gameStarted: data.room.gameStarted,
          gameEnded: false,
          roundNumber: prev?.roundNumber || 0,
          currentStake: prev?.currentStake || 0,
          pot: prev?.pot || 0,
          highestBet: prev?.highestBet || 0,
          currentTurn: prev?.currentTurn || null,
          currentTurnSocketId: prev?.currentTurnSocketId || null,
        }));
      }
    });

    socket.on("GAME_STARTED", (data: any) => {
      setShowdownData(null);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              gameStarted: true,
              roundNumber: data.roundNumber,
              currentStake: data.currentStake,
              pot: data.pot,
            }
          : null,
      );
    });

    socket.on("ROUND_START", (data: any) => {
      setShowdownData(null);
      setMyCards([]);
      setGameState((prev) =>
        prev
          ? {
              ...prev,
              roundNumber: data.roundNumber,
              currentStake: data.currentStake,
              pot: data.pot,
            }
          : null,
      );
    });

    socket.on("DEAL_CARDS", (data: any) => {
      setMyCards(data.cards);
    });

    socket.on("GAME_STATE_UPDATE", (data: GameState) => {
      setGameState(data);
    });

    socket.on("PLAYER_ACTION_RESULT", () => {
      // State will be updated via GAME_STATE_UPDATE
    });

    socket.on("SHOWDOWN", (data: ShowdownData) => {
      setShowdownData(data);
      if (data.gameEnded && data.gameWinner) {
        setGameEndData({
          gameEnded: true,
          winner: data.gameWinner,
          finalStandings: data.playersState,
        });
      }
    });

    socket.on("GAME_END", (data: GameEndData) => {
      setGameEndData(data);
    });

    socket.emit("GET_GAME_STATE", {}, (response: any) => {
      if (response.success && response.state) {
        setGameState(response.state);
        if (response.state.myCards) {
          setMyCards(response.state.myCards);
        }
      } else if (response.error) {
        setError(response.error);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("ROOM_UPDATED");
      socket.off("PLAYER_JOINED");
      socket.off("PLAYER_LEFT");
      socket.off("PLAYER_DISCONNECTED");
      socket.off("GAME_STARTED");
      socket.off("ROUND_START");
      socket.off("DEAL_CARDS");
      socket.off("GAME_STATE_UPDATE");
      socket.off("PLAYER_ACTION_RESULT");
      socket.off("SHOWDOWN");
      socket.off("GAME_END");
    };
  }, [socket]);

  const handleStartGame = () => {
    socket.emit("START_GAME", {}, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleStartNewRound = () => {
    setShowdownData(null);
    socket.emit("START_NEW_ROUND", {}, (response: any) => {
      if (response.error) {
        setError(response.error);
      }
      if (response.gameEnded) {
        // Will be handled by GAME_END event
      }
    });
  };

  const handleLeaveRoom = () => {
    socket.emit("LEAVE_ROOM", {}, () => {
      navigate("/");
    });
  };

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#2c3e50",
          color: "#fff",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div style={{ fontSize: "24px" }}>Error: {error}</div>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#2c3e50",
          color: "#fff",
          fontSize: "24px",
        }}
      >
        Loading...
      </div>
    );
  }

  if (gameEndData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#2c3e50",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "40px",
            maxWidth: "500px",
            width: "100%",
          }}
        >
          <h1
            style={{
              margin: "0 0 30px 0",
              color: "#2c3e50",
              textAlign: "center",
            }}
          >
            Game Over!
          </h1>

          {gameEndData.winner && (
            <div
              style={{
                backgroundColor: "#f39c12",
                color: "#fff",
                padding: "20px",
                borderRadius: "8px",
                textAlign: "center",
                marginBottom: "20px",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            >
              🏆 {gameEndData.winner.name} Wins!
            </div>
          )}

          <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
            Final Standings
          </h3>
          {gameEndData.finalStandings.map((player, idx) => (
            <div
              key={player.id}
              style={{
                padding: "12px",
                backgroundColor: idx === 0 ? "#f39c12" : "#ecf0f1",
                borderRadius: "6px",
                marginBottom: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: idx === 0 ? "#fff" : "#2c3e50",
              }}
            >
              <span style={{ fontWeight: "bold" }}>
                {idx + 1}. {player.name}
              </span>
              <span>{player.points} points</span>
            </div>
          ))}

          <button
            onClick={handleLeaveRoom}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Find my player - try socketId first, then fallback to comparing by other fields
  const myPlayer = gameState.players.find((p) => p.socketId === mySocketId) || 
                   gameState.players.find((p) => p.id === mySocketId);
  const isSpectating = myPlayer?.isSpectator || myPlayer?.isEliminated || false;

  return (
    <div>
      {!gameState.gameStarted && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "#34495e",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
            zIndex: 1000,
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              Room: {gameState.roomCode}
            </div>
            <div style={{ fontSize: "14px", marginTop: "5px" }}>
              {gameState.players.length} / 8 players
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {myPlayer?.isHost && (
              <button
                onClick={handleStartGame}
                disabled={gameState.players.length < 2}
                style={{
                  padding: "12px 24px",
                  backgroundColor:
                    gameState.players.length >= 2 ? "#27ae60" : "#95a5a6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor:
                    gameState.players.length >= 2 ? "pointer" : "not-allowed",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                Start Game
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              style={{
                padding: "12px 24px",
                backgroundColor: "#e74c3c",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              Leave Room
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: !gameState.gameStarted ? "100px" : "0" }}>
        {gameState.gameStarted ? (
          <GameTable
            gameState={gameState}
            myCards={myCards}
            mySocketId={mySocketId}
            isSpectating={isSpectating}
            showdownData={showdownData}
            onStartNewRound={handleStartNewRound}
          />
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <div
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "30px",
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
                Waiting for game to start...
              </h2>
              <div style={{ color: "#7f8c8d", marginBottom: "20px" }}>
                {myPlayer?.isHost
                  ? "You are the host. Start the game when ready (minimum 2 players)."
                  : "Waiting for host to start the game..."}
              </div>
              <div
                style={{
                  border: "1px solid #bdc3c7",
                  borderRadius: "8px",
                  padding: "20px",
                }}
              >
                <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
                  Players
                </h3>
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    style={{
                      padding: "10px",
                      backgroundColor: "#ecf0f1",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: "bold", color: "#2c3e50" }}>
                      {player.name}
                      {player.isHost && " 👑"}
                      {player.socketId === mySocketId && " (You)"}
                    </span>
                    <span style={{ color: "#7f8c8d" }}>
                      {player.points} points
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
