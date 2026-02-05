import { useState } from "react";
import { getSocket } from "../socket/socket";

interface ActionPanelProps {
  canAct: boolean;
  currentStake: number;
  highestBet: number;
  myCurrentBet: number;
  myPoints: number;
}

export const ActionPanel = ({
  canAct,
  currentStake,
  highestBet,
  myCurrentBet,
  myPoints,
}: ActionPanelProps) => {
  const [betAmount, setBetAmount] = useState<string>("");
  const [raiseAmount, setRaiseAmount] = useState<string>("");

  const socket = getSocket();

  const handleBet = () => {
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount < currentStake) return;

    socket.emit("PLAYER_ACTION", {
      action: "bet",
      amount,
    });
    setBetAmount("");
  };

  const handleCall = () => {
    socket.emit("PLAYER_ACTION", {
      action: "call",
    });
  };

  const handleRaise = () => {
    const amount = parseInt(raiseAmount);
    if (isNaN(amount) || amount <= highestBet) return;

    socket.emit("PLAYER_ACTION", {
      action: "raise",
      amount,
    });
    setRaiseAmount("");
  };

  const handleFold = () => {
    socket.emit("PLAYER_ACTION", {
      action: "fold",
    });
  };

  const handleAllIn = () => {
    socket.emit("PLAYER_ACTION", {
      action: "all-in",
    });
  };

  if (!canAct) {
    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #bdc3c7",
          borderRadius: "8px",
          backgroundColor: "#ecf0f1",
          textAlign: "center",
          color: "#7f8c8d",
        }}
      >
        Waiting for your turn...
      </div>
    );
  }

  const callAmount = highestBet - myCurrentBet;
  const canCall = callAmount > 0 && myPoints >= callAmount;
  const canBet = highestBet === 0 && myPoints >= currentStake;
  const canRaise = highestBet > 0 && myPoints > callAmount;

  return (
    <div
      style={{
        padding: "20px",
        border: "2px solid #3498db",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>Your Turn</h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {canBet && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder={`Min: ${currentStake}`}
              min={currentStake}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #bdc3c7",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handleBet}
              disabled={!betAmount || parseInt(betAmount) < currentStake}
              style={{
                padding: "10px 20px",
                backgroundColor: "#27ae60",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Bet
            </button>
          </div>
        )}

        {canCall && (
          <button
            onClick={handleCall}
            style={{
              padding: "10px 20px",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Call ({callAmount})
          </button>
        )}

        {canRaise && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              placeholder={`Min: ${highestBet + 1}`}
              min={highestBet + 1}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #bdc3c7",
                fontSize: "14px",
              }}
            />
            <button
              onClick={handleRaise}
              disabled={!raiseAmount || parseInt(raiseAmount) <= highestBet}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e67e22",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              Raise
            </button>
          </div>
        )}

        <button
          onClick={handleFold}
          style={{
            padding: "10px 20px",
            backgroundColor: "#95a5a6",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          Fold
        </button>

        {myPoints > 0 && (
          <button
            onClick={handleAllIn}
            style={{
              padding: "10px 20px",
              backgroundColor: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            All-in ({myPoints})
          </button>
        )}
      </div>
    </div>
  );
};
