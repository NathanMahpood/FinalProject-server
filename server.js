import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import indexRoute from "./routes/index.route.js";
import "./db/dbConnection.js";
import Logger from "./utils/Logger.js";
import { PORT } from "./env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.on("connection", (socket) => {
  Logger.info(`Client connected: ${socket.id}`);

  // Handle joining a room for a specific station and route
  socket.on("join-station-room", ({ stationId, route_mkt, routeDirection }) => {
    // Ensure consistent string types for room name
    const roomName = `station-${String(stationId)}-route-${String(route_mkt)}-dir-${String(routeDirection || "1")}`;
    socket.join(roomName);
    const room = io.sockets.adapter.rooms.get(roomName);
    const roomSize = room ? room.size : 0;
    Logger.info(`[SOCKET] Client ${socket.id} joined room: ${roomName} (${roomSize} total clients)`);
  });

  // Handle leaving a room
  socket.on("leave-station-room", ({ stationId, route_mkt, routeDirection }) => {
    const roomName = `station-${stationId}-route-${route_mkt}-dir-${routeDirection || "1"}`;
    socket.leave(roomName);
    Logger.info(`Client ${socket.id} left room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    Logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Make io available to routes
app.set("io", io);

// use - middleware

// cors
app.use(cors());

// express.json() - middleware that parses incoming requests with JSON payloads
app.use(express.json());

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// for every request, use the router
app.use(indexRoute);

// listen - start the server and listen to requests
// param1 port - the port number to listen to
// param2 callback function - what to do when the server starts
httpServer.listen(PORT, () => {
  Logger.info("Server is running on port http://localhost:3000");
  Logger.info("Socket.io server initialized");
});
