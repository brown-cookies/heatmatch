import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ─── JWT Secret ───────────────────────────────────────────────────────────────
// Falls back to a dev default — MUST be overridden in production via env var.

export function getJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    console.warn(
      "⚠  ADMIN_JWT_SECRET not set — using insecure default. Set it in .env for production."
    );
    return "heatmatch-dev-secret-change-me";
  }
  return secret;
}

// ─── Generate token ───────────────────────────────────────────────────────────

export function generateAdminToken(): string {
  return jwt.sign({ role: "admin" }, getJwtSecret(), { expiresIn: "8h" });
}

// ─── Middleware ───────────────────────────────────────────────────────────────
// Attach to any route that should be admin-only.

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { role: string };
    if (payload.role !== "admin") throw new Error("Not admin");
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
