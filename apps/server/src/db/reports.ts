// In-memory report store — data lives as long as the server process.
// Swap this out for a real DB later when needed.

export type ReportReason =
  | "harassment"
  | "spam"
  | "underage"
  | "explicit"
  | "other";

export interface CreateReportInput {
  reporterSession: string;
  reportedSession: string;
  roomId: string;
  reason: ReportReason;
}

export interface Report extends CreateReportInput {
  id: number;
  createdAt: Date;
}

let nextId = 1;
const reports: Report[] = [];

export function createReport(input: CreateReportInput): Report {
  const report: Report = { ...input, id: nextId++, createdAt: new Date() };
  reports.push(report);
  return report;
}

export function getAllReports(): Report[] {
  return [...reports];
}
