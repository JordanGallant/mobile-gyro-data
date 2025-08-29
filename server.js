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
  console.log('New WebSocket connection');
  
  ws.on("message", (msg) => {
    try {
      // Convert Buffer to string if needed
      const messageStr = msg.toString();
      const data = JSON.parse(messageStr);
      
      console.log('Received message:', data.type);
      
      if (data.type === "sender") {
        senders.push(ws);
        console.log(`Sender connected. Total senders: ${senders.length}`);
      } else if (data.type === "viewer") {
        viewers.push(ws);
        console.log(`Viewer connected. Total viewers: ${viewers.length}`);
      } else if (data.type === "gyro") {
        // Broadcast to all viewers
        console.log(`Broadcasting gyro data to ${viewers.length} viewers`);
        viewers.forEach(viewer => {
          if (viewer.readyState === WebSocket.OPEN) {
            // Send as string, not as buffer
            viewer.send(messageStr);
          }
        });
      }
    } catch (e) {
      console.error("Invalid message", e);
      console.log("Raw message:", msg);
    }
  });

  ws.on("close", () => {
    console.log('WebSocket connection closed');
    // Remove from both arrays
    const viewerIndex = viewers.indexOf(ws);
    const senderIndex = senders.indexOf(ws);
    
    if (viewerIndex > -1) {
      viewers.splice(viewerIndex, 1);
      console.log(`Viewer disconnected. Total viewers: ${viewers.length}`);
    }
    
    if (senderIndex > -1) {
      senders.splice(senderIndex, 1);
      console.log(`Sender disconnected. Total senders: ${senders.length}`);
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on Port: ${PORT}`);
  console.log('Available endpoints:');
  console.log(`- Sender: http://localhost:${PORT}/sender`);
  console.log(`- Viewer: http://localhost:${PORT}/viewer`);
});