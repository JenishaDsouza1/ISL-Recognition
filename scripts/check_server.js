// small script to check websocket backend
const WebSocket = require("ws");
const url = process.argv[2] || "ws://127.0.0.1:8000/ws";
const timeout = 3000;

const ws = new WebSocket(url, { handshakeTimeout: timeout });

ws.on("open", () => {
  console.log("OK: connected to", url);
  ws.close();
  process.exit(0);
});

ws.on("error", (err) => {
  console.error("ERROR: failed to connect to", url);
  console.error(err.message || err);
  process.exit(1);
});
