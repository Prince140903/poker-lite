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
  const [raiseAmount, setRaiseAmount] = useState<string>("");

  const socket = getSocket();

  const handleCall = () => {
    socket.emit("PLAYER_ACTION", {
      action: "call",
    }, (response: any) => {
      if (response?.error) {
        console.error("Call error:", response.error);
      }
    });
  };

  const handleRaise = () => {
    const amount = parseInt(raiseAmount);
    if (isNaN(amount)) return;

    socket.emit("PLAYER_ACTION", {
      action: "raise",
      amount,
    }, (response: any) => {
      if (response?.error) {
        console.error("Raise error:", response.error);
      }
    });
    setRaiseAmount("");
  };

  const handleFold = () => {
    socket.emit("PLAYER_ACTION", {
      action: "fold",
    }, (response: any) => {
      if (response?.error) {
        console.error("Fold error:", response.error);
      }
    });
  };

  const handleAllIn = () => {
    socket.emit("PLAYER_ACTION", {
      action: "all-in",
    }, (response: any) => {
      if (response?.error) {
        console.error("All-in error:", response.error);
      }
    });
  };

  if (!canAct) {
    return (
      <div
        style={{
          padding: "clamp(15px, 2vw, 20px)",
          border: "1px solid #bdc3c7",
          borderRadius: "8px",
          backgroundColor: "#ecf0f1",
          textAlign: "center",
          color: "#7f8c8d",
          fontSize: "clamp(12px, 2vw, 14px)",
        }}
      >
        Waiting for your turn...
      </div>
    );
  }

  const callAmount = highestBet - myCurrentBet;
  const canCall = highestBet > 0 && myPoints >= callAmount;
  const canRaise = myPoints > highestBet;
  const minRaise = highestBet > 0 ? highestBet + currentStake : currentStake;

  return (
    <div
      style={{
        padding: "clamp(15px, 2vw, 20px)",
        border: "2px solid #3498db",
        borderRadius: "8px",
        backgroundColor: "#fff",
        maxWidth: "min(400px, 90vw)",
      }}
    >
      <h3 style={{ margin: "0 0 15px 0", color: "#2c3e50", fontSize: "clamp(14px, 2.5vw, 18px)" }}>Your Turn</h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Call Button - Match the current highest bet */}
        {canCall && (
          <button
            onClick={handleCall}
            style={{
              padding: "clamp(10px, 2vw, 12px) clamp(15px, 3vw, 20px)",
              backgroundColor: "#3498db",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "clamp(14px, 2vw, 16px)",
              fontWeight: "bold",
              minHeight: "44px",
            }}
          >
            Call ({callAmount} points)
          </button>
        )}

        {/* Raise Button - Increase the bet */}
        {canRaise && (
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="number"
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              placeholder={`Min: ${minRaise}`}
              min={minRaise}
              style={{
                flex: 1,
                padding: "clamp(8px, 1.5vw, 10px)",
                borderRadius: "4px",
                border: "1px solid #bdc3c7",
                fontSize: "clamp(12px, 2vw, 14px)",
                minHeight: "44px",
              }}
            />
            <button
              onClick={handleRaise}
              disabled={!raiseAmount || parseInt(raiseAmount) < minRaise}
              style={{
                padding: "clamp(10px, 2vw, 12px) clamp(15px, 3vw, 20px)",
                backgroundColor: "#e67e22",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "clamp(14px, 2vw, 16px)",
                fontWeight: "bold",
                opacity: !raiseAmount || parseInt(raiseAmount) < minRaise ? 0.6 : 1,
                minHeight: "44px",
              }}
            >
              Raise
            </button>
          </div>
        )}

        {/* Fold Button */}
        <button
          onClick={handleFold}
          style={{
            padding: "clamp(10px, 2vw, 12px) clamp(15px, 3vw, 20px)",
            backgroundColor: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "clamp(14px, 2vw, 16px)",
            fontWeight: "bold",
            minHeight: "44px",
          }}
        >
          Fold
        </button>

        {/* All-In Button */}
        {myPoints > 0 && (
          <button
            onClick={handleAllIn}
            style={{
              padding: "clamp(8px, 1.5vw, 10px) clamp(15px, 3vw, 20px)",
              backgroundColor: "#e74c3c",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "clamp(12px, 2vw, 14px)",
              fontWeight: "bold",
              minHeight: "44px",
            }}
          >
            All-in ({myPoints})
          </button>
        )}
      </div>
    </div>
  );
};
