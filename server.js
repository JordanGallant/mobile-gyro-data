const express = require("express");
const https = require('https');
const QRCode = require('qrcode');
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

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

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

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const PORT = 3000;
server.listen(PORT, async () => {
  const localIP = getLocalIP();
  const url = `http://${localIP}:${PORT}/sender.html`;
  
  console.log(`Server running on ${PORT}`);
  console.log(`Access URL: ${url}`);
  console.log('\nQR Code:');
  
  try {
    // Generate QR code in terminal
    const qrString = await QRCode.toString(url, { type: 'terminal' });
    console.log(qrString);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
});
