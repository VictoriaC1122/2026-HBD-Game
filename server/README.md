# Optional WebSocket Room Server

The GitHub Pages frontend still works with PeerJS and does not require this server.

Use this server when you want a more stable production path for large rooms, private events, or future fully server-authoritative simulation.

## Run Locally

```bash
cd server
npm install
npm start
```

Default port: `8787`

```bash
PORT=9000 MAX_PLAYERS=50 npm start
```

## Architecture

- Host creates a room.
- Players join the room by code.
- Controllers send compact events to the room server.
- Host can publish authoritative state snapshots.
- The server tracks disconnects, stale players, and room capacity.

The current GitHub Pages client keeps PeerJS as the zero-setup default. The server is intentionally isolated so the static deployment remains simple.
