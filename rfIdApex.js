import { SerialPort } from "serialport";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

const app = express();
const port = 3001;

// Enable CORS to allow requests from Oracle APEX
app.use(cors());

// Replace 'COM1' with your actual COM port
const RFIDPort = new SerialPort({
  path: "COM1",
  baudRate: 9600, // Set this to your scanner's baud rate
});

let rfidData = "";

// Set up a WebSocket server
const wss = new WebSocketServer({ port: 8081 });

wss.on("connection", function connection(ws) {
  console.log("Client connected");
});

// Event handler for receiving data from RFID
RFIDPort.on("data", function (data) {
  const rawData = data.toString().trim(); // Store the latest RFID data
  // console.log("RFID Data:", rfidData);
  // const rawData = data.toString(); // Convert buffer to string
  const sanitizedData = rawData.replace(/[^a-zA-Z0-9]/g, ""); // Remove non-alphanumeric characters
  console.log("RFID Data (sanitized):", sanitizedData); // Log sanitized RFID data to console
  rfidData = sanitizedData; // Store the sanitized RFID data

  // Broadcast the RFID data to all connected clients
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(rfidData);
    }
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the RFID API. Access RFID data at /rfid.");
});

// API endpoint to get the RFID data
app.get("/rfid", (req, res) => {
  res.json({ rfidData }); // Send the latest RFID data as JSON
});

app.listen(port, () => {
  console.log(`RFID API running on http://localhost:${port}`);
});
