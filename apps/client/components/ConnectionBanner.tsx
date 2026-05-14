"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export function ConnectionBanner() {
  const [state, setState] = useState<"connected" | "reconnecting" | "failed">("connected");

  useEffect(() => {
    const socket = getSocket();
    const onDisconnect = (reason: string) => {
      if (reason !== "io server disconnect") setState("reconnecting");
    };
    socket.on("disconnect", onDisconnect);
    socket.on("connect", () => setState("connected"));
    socket.io.on("reconnect_failed", () => setState("failed"));
    return () => {
      socket.off("disconnect", onDisconnect);
      socket.off("connect");
      socket.io.off("reconnect_failed");
    };
  }, []);

  if (state === "connected") return null;

  return (
    <div className={`fixed top-0 inset-x-0 z-50 py-2 px-4 text-center text-xs font-semibold ${
      state === "reconnecting" ? "bg-[#F59E0B] text-bg" : "bg-danger text-white"
    }`}>
      {state === "reconnecting"
        ? "Connection lost — reconnecting..."
        : <>Connection failed. <button onClick={() => window.location.reload()} className="underline">Reload</button></>
      }
    </div>
  );
}
