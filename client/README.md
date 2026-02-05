# Poker Lite Client

React + TypeScript frontend for the Poker Lite multiplayer card game.

## Setup

```bash
npm install
npm run dev
```

Client runs on http://localhost:3000

## Configuration

Edit `.env` to change the backend URL:

```
VITE_SOCKET_URL=http://localhost:3001
```

## Structure

- `src/socket/socket.ts` - Socket.IO connection
- `src/types/game.ts` - TypeScript types
- `src/pages/Home.tsx` - Create/Join room
- `src/pages/Room.tsx` - Game room
- `src/components/` - UI components
