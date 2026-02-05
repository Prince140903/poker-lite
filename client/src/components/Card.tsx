import { Card as CardType } from "../types/game";

interface CardProps {
  card: CardType;
}

export const Card = ({ card }: CardProps) => {
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case "hearts":
        return "♥";
      case "diamonds":
        return "♦";
      case "clubs":
        return "♣";
      case "spades":
        return "♠";
      default:
        return "";
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === "hearts" || suit === "diamonds" ? "#e74c3c" : "#2c3e50";
  };

  return (
    <div
      style={{
        width: "80px",
        height: "110px",
        border: "2px solid #34495e",
        borderRadius: "8px",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        margin: "5px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }}
    >
      <div
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          color: getSuitColor(card.suit),
        }}
      >
        {card.rank}
      </div>
      <div
        style={{
          fontSize: "24px",
          color: getSuitColor(card.suit),
        }}
      >
        {getSuitSymbol(card.suit)}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#7f8c8d",
          marginTop: "5px",
        }}
      >
        {card.value}
      </div>
    </div>
  );
};
