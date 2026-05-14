import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { ClientToServerEvents, ServerToClientEvents } from "@heatmatch/types";
import { registerHandlers } from "./socket/handler";
import reportsRouter from "./routers/reports";
import adminRouter from "./routers/admin";

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.use("/reports", reportsRouter);
app.use("/admin", adminRouter);

io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);
  registerHandlers(io, socket);
  socket.on("disconnect", () => console.log(`[-] Disconnected: ${socket.id}`));
});

const PORT = process.env.PORT || 3001;

async function main() {
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main();
