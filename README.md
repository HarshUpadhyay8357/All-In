# All-In — Realtime Multiplayer Texas Hold'em

A full-stack, realtime multiplayer poker platform.
Live demo: https://all-in-orcin.vercel.app/ 

## Features 

- Realtime multiplayer (2-6 players per table) via Socket.IO
- Full No-Limit Texas Hold'em rules engine: blinds, betting rounds, side pots, showdown
- JWT authentication with access + refresh token rotation
- Server-authoritative game state (client never trusted with game logic)
- Reconnect support — rejoin mid-hand after disconnect, game state restored from Redis
- Server-side turn timer with auto-fold on timeout
- Custom oval poker table UI with seat positioning, card animations, and showdown reveal

## Tech Stack

**Frontend:** Next.js, TypeScript, Zustand, Socket.IO client

**Backend:** Node.js, Express, Socket.IO, TypeScript

**Database:** PostgreSQL (Neon) via Drizzle ORM

**Cache / Game State:** Redis (Upstash)

**Hand Evaluation:** pokersolver

**Deployment:** Vercel (frontend), Render (backend)


## Key Engineering Decisions

- **Side pot algorithm**: when multiple players go all-in at different stack sizes,
  pots are split into eligible tiers calculated from sorted bet amounts — refer to
  `server/src/game/side-pot.ts`
- **State sanitization**: each player receives a per-socket sanitized copy of game
  state with opponents' hole cards stripped — refer to `getSanitizedState()` in
  `server/src/game/state-manager.ts`
- **Idempotent game actions**: both `joinRoom()` and `startGame()` are safe to call
  multiple times for the same room without side effects, protecting against
  double-fires from network retries or React re-renders

## Local Setup

bash
git clone https://github.com/HarshUpadhyay8357/All-In.git

cd poker   
 
# Backend
cd server

npm install

cp .env.example .env   # fill in your own DB/Redis/JWT values

npm run dev

# Frontend (separate terminal)
cd client

npm install

cp .env.example .env.local

npm run dev

## Demo

https://all-in-orcin.vercel.app/