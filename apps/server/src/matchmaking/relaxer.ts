import { Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents } from "@heatmatch/types";
import { RelaxStage } from "./matcher";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// ─── Relaxer ──────────────────────────────────────────────────────────────────
// Manages per-user queue stage upgrades over time.
// Fix 7: removed unused `entry` constructor parameter.

export class Relaxer {
  private timers: NodeJS.Timeout[] = [];
  public stage: RelaxStage = 0;

  constructor(
    private socket: AppSocket,
    private onStageChange: (stage: RelaxStage) => void
  ) {}

  start() {
    // T+15s → relax age range
    this.timers.push(
      setTimeout(() => {
        this.stage = 1;
        this.socket.emit("queue_status", {
          message: "Widening age range...",
          stage: 1,
        });
        this.onStageChange(1);
      }, 15_000)
    );

    // T+30s → relax university
    this.timers.push(
      setTimeout(() => {
        this.stage = 2;
        this.socket.emit("queue_status", {
          message: "Opening to all universities...",
          stage: 2,
        });
        this.onStageChange(2);
      }, 30_000)
    );

    // T+60s → give up, let client know
    this.timers.push(
      setTimeout(() => {
        this.socket.emit("no_match");
      }, 60_000)
    );
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }
}
