import { Router } from "express";
import { createReport, ReportReason } from "../db/reports";

const router = Router();

const VALID_REASONS: ReportReason[] = [
  "harassment",
  "spam",
  "underage",
  "explicit",
  "other",
];

// POST /reports
// Body: { reporterSession, reportedSession, roomId, reason }

router.post("/", (req, res) => {
  const { reporterSession, reportedSession, roomId, reason } = req.body;

  if (!reporterSession || !reportedSession || !roomId || !reason) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!VALID_REASONS.includes(reason)) {
    return res.status(400).json({ error: "Invalid reason" });
  }

  if (reporterSession === reportedSession) {
    return res.status(400).json({ error: "Cannot report yourself" });
  }

  createReport({ reporterSession, reportedSession, roomId, reason });
  res.json({ success: true });
});

export default router;
