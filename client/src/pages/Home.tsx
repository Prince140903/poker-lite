import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../socket/socket";

export const Home = () => {
  const [username, setUsername] = useState("");
  const [usernameSet, setUsernameSet] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("8");
  const [initialStake, setInitialStake] = useState("100");
  const [startingPoints, setStartingPoints] = useState("1000");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const socket = getSocket();

  useEffect(() => {
    const savedUsername = localStorage.getItem("pokerUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setUsernameSet(true);
    }
  }, []);

  const handleSetUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    localStorage.setItem("pokerUsername", username.trim());
    setUsernameSet(true);
    setError("");
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();

    const maxP = parseInt(maxPlayers);
    const stake = parseInt(initialStake);
    const points = parseInt(startingPoints);

    if (maxP < 2 || maxP > 8) {
      setError("Max players must be between 2 and 8");
      return;
    }

    if (stake < 1) {
      setError("Stake must be at least 1");
      return;
    }

    if (points < stake) {
      setError("Starting points must be at least equal to stake");
      return;
    }

    setLoading(true);
    setError("");

    socket.emit(
      "CREATE_ROOM",
      {
        playerName: username,
        initialStake: stake,
        maxPlayers: maxPlayers,
        startingPoints: points,
      },
      (response: any) => {
        setLoading(false);

        if (response.error) {
          setError(response.error);
        } else if (response.success) {
          // Pass the initial room state through navigation
          navigate(`/room/${response.roomCode}`, {
            state: { initialRoom: response.room }
          });
        }
      },
    );
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();

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
        playerName: username,
      },
      (response: any) => {
        setLoading(false);

        if (response.error) {
          setError(response.error);
        } else if (response.success) {
          // Pass the initial room state through navigation
          navigate(`/room/${response.roomCode}`, {
            state: { initialRoom: response.room }
          });
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
          maxWidth: "500px",
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

        {!usernameSet ? (
          <form onSubmit={handleSetUsername}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  color: "#2c3e50",
                  fontWeight: "bold",
                }}
              >
                Choose Your Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                autoFocus
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
              }}
            >
              Continue
            </button>
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
          </form>
        ) : (
          <>
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                backgroundColor: "#ecf0f1",
                borderRadius: "6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#2c3e50", fontWeight: "bold" }}>
                Username: {username}
              </span>
              <button
                onClick={() => {
                  setUsernameSet(false);
                  localStorage.removeItem("pokerUsername");
                }}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#95a5a6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>

            <form onSubmit={handleCreateRoom}>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Create Room
              </h3>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#2c3e50",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  Max Players (2-8)
                </label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  min="2"
                  max="8"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #bdc3c7",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#2c3e50",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  Initial Stake
                </label>
                <input
                  type="number"
                  value={initialStake}
                  onChange={(e) => setInitialStake(e.target.value)}
                  min="1"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #bdc3c7",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "6px",
                    color: "#2c3e50",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  Starting Points per Player
                </label>
                <input
                  type="number"
                  value={startingPoints}
                  onChange={(e) => setStartingPoints(e.target.value)}
                  min={initialStake}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #bdc3c7",
                    fontSize: "14px",
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

            <form
              onSubmit={handleJoinRoom}
              style={{
                borderTop: "1px solid #bdc3c7",
                paddingTop: "20px",
              }}
            >
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                Join Room
              </h3>

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
          </>
        )}
      </div>
    </div>
  );
};
