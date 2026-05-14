import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@heatmatch/types";

// One socket instance for the entire app lifetime.
// Lazy-initialized on first import.
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001", {
      autoConnect: false, // We connect manually when the user clicks "Find Stranger"
    });
  }
  return socket;
}
