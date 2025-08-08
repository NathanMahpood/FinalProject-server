import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import indexRoute from "./routes/index.route.js";
import "./db/dbConnection.js";
import Logger from "./utils/Logger.js";
import { PORT } from "./env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
app.listen(PORT, () => {
  Logger.info("Server is running on port http://localhost:3000");
});
