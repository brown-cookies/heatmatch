import { Router } from "express";
import { adminAuth, generateAdminToken } from "../middleware/adminAuth";
import { getLiveStats, getOverviewStats } from "../analytics/stats";
import { getAllReports } from "../db/reports";

const router = Router();

// ─── POST /admin/login ────────────────────────────────────────────────────────
router.post("/login", (req, res) => {
  const { secret } = req.body;

  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return res.status(503).json({ error: "Admin not configured" });
  }

  if (!secret || secret !== adminSecret) {
    return res.status(401).json({ error: "Invalid secret" });
  }

  const token = generateAdminToken();
  res.json({ token });
});

// ─── GET /admin/live ──────────────────────────────────────────────────────────
// Real-time data from Redis — online users, active rooms, queue sizes.
router.get("/live", adminAuth, async (_, res) => {
  try {
    const data = await getLiveStats();
    res.json(data);
  } catch (err) {
    console.error("[admin/live]", err);
    res.status(500).json({ error: "Failed to fetch live stats" });
  }
});

// ─── GET /admin/overview ──────────────────────────────────────────────────────
// Lifetime totals from Redis counters.
router.get("/overview", adminAuth, async (_, res) => {
  try {
    const data = await getOverviewStats();
    res.json(data);
  } catch (err) {
    console.error("[admin/overview]", err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

// ─── GET /admin/reports ───────────────────────────────────────────────────────
// In-memory reports list.
router.get("/reports", adminAuth, (_, res) => {
  res.json({ reports: getAllReports() });
});

export default router;
