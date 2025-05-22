const express = require("express");
const os = require('os');
const cors = require("cors")
const http = require("http");
const path = require("path");
const WebSocket = require("ws")
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


//endpoint to view
app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});
//endpoint to send
app.get('/sender', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sender.html'));
});

let viewers = [];
let senders = [];

wss.on("connection", (ws, req) => {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === "sender") {
        senders.push(ws);
      } else if (data.type === "viewer") {
        viewers.push(ws);
      } else if (data.type === "gyro") {
        // Broadcast to viewers
        viewers.forEach(v => v.readyState === WebSocket.OPEN && v.send(msg));
      }
    } catch (e) {
      console.error("Invalid message", e);
    }
  });

  ws.on("close", () => {
    viewers = viewers.filter(w => w !== ws);
    senders = senders.filter(w => w !== ws);
  });
});

app.use(express.static("public"));



const PORT = 3000;
server.listen(PORT, async () => {
console.log(`running on Port:${PORT}`)
});
