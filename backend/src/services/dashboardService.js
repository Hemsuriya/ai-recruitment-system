const db = require("../config/db");
const dashboardQueries = require("../queries/dashboardQueries");

function toNumber(value) {
  return Number(value) || 0;
}

function formatTimeAgo(value) {
  const timestamp = new Date(value);
  const diffMs = Date.now() - timestamp.getTime();

  if (Number.isNaN(timestamp.getTime()) || diffMs < 0) {
    return "just now";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes === 1) {
    return "1 min ago";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} mins ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) {
    return "1 hour ago";
  }
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "1 day ago";
  }
  return `${diffDays} days ago`;
}

exports.getSummary = async () => {
  const summaryResult = await db.query(dashboardQueries.summaryQuery);
  const summaryRow = summaryResult.rows[0] || {};

  return {
    totalCandidates: toNumber(summaryRow.totalCandidates),
    avgScore: toNumber(summaryRow.avgScore),
    shortlisted: toNumber(summaryRow.shortlisted),
    pendingDecision: toNumber(summaryRow.pendingDecision),
  };
};

exports.getFunnel = async () => {
  const funnelResult = await db.query(dashboardQueries.funnelQuery);
  return funnelResult.rows.map((row) => ({
    stage: row.stage,
    count: toNumber(row.count),
  }));
};

exports.getStageScores = async () => {
  const stageScoresResult = await db.query(dashboardQueries.stageScoresQuery);
  return stageScoresResult.rows.map((row) => ({
    stage: row.stage,
    avgScore: toNumber(row.avgScore),
  }));
};

exports.getRecentCandidates = async () => {
  const recentCandidatesResult = await db.query(dashboardQueries.recentCandidatesQuery);
  return recentCandidatesResult.rows.map((row) => ({
    name: row.name,
    role: row.role || "",
    resume: toNumber(row.resume),
    mcq: toNumber(row.mcq),
    video: toNumber(row.video),
    verdict: row.verdict || "pending",
  }));
};

exports.getRecentActivity = async () => {
  const recentActivityResult = await db.query(dashboardQueries.recentActivityQuery);
  return recentActivityResult.rows.map((row) => ({
    text: row.text,
    timeAgo: formatTimeAgo(row.event_time),
    type: row.type,
  }));
};

exports.getDashboard = async () => {
  const [summary, funnel, stageScores, recentCandidates, recentActivity] = await Promise.all([
    exports.getSummary(),
    exports.getFunnel(),
    exports.getStageScores(),
    exports.getRecentCandidates(),
    exports.getRecentActivity(),
  ]);

  return { summary, funnel, stageScores, recentCandidates, recentActivity };
};
