import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket/socket";

export const Home = () => {
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const socket = getSocket();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError("Player name is required");
      return;
    }

    setLoading(true);
    setError("");

    socket.emit(
      "CREATE_ROOM",
      {
        playerName: playerName.trim(),
        initialStake: 100,
      },
      (response: any) => {
        setLoading(false);

        if (response.error) {
          setError(response.error);
        } else if (response.success) {
          navigate(`/room/${response.roomCode}`);
        }
      },
    );
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError("Player name is required");
      return;
    }

    if (!roomCode.trim()) {
      setError("Room code is required");
      return;
    }

    setLoading(true);
    setError("");

    socket.emit(
      "JOIN_ROOM",
      {
        roomCode: roomCode.trim().toUpperCase(),
        playerName: playerName.trim(),
      },
      (response: any) => {
        setLoading(false);

        if (response.error) {
          setError(response.error);
        } else if (response.success) {
          navigate(`/room/${response.roomCode}`);
        }
      },
    );
  };

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
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            margin: "0 0 30px 0",
            color: "#2c3e50",
            textAlign: "center",
          }}
        >
          Poker Lite
        </h1>

        <form onSubmit={handleCreateRoom}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#2c3e50",
                fontWeight: "bold",
              }}
            >
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "6px",
                border: "1px solid #bdc3c7",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#27ae60",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: "20px",
            }}
          >
            Create Room
          </button>
        </form>

        </form>

        <form
          onSubmit={handleJoinRoom}
          style={{
            borderTop: "1px solid #bdc3c7",
            margin: "20px 0",
            paddingTop: "20px",
          }}
        >
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#2c3e50",
              fontWeight: "bold",
            }}
          >
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            disabled={loading}
            maxLength={6}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #bdc3c7",
              fontSize: "16px",
              marginBottom: "10px",
              boxSizing: "border-box",
              textTransform: "uppercase",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Join Room
          </button>
        </form>

        {error && (
          <div
            style={{
              marginTop: "20px",
              padding: "12px",
              backgroundColor: "#e74c3c",
              color: "#fff",
              borderRadius: "6px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
