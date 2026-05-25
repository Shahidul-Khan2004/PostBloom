import * as XLSX from "xlsx";
import BackendError from "../lib/BackendError.js";

function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url.trim().split("?")[0];
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function sheetToRows(workbook, name) {
  const sheet = workbook.Sheets[name];
  if (!sheet) return null;
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
}

function findTopPostsHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = (rows[i] ?? []).map((c) => (c != null ? String(c).trim() : ""));
    const urlIndices = row
      .map((c, idx) => (c === "Post URL" ? idx : -1))
      .filter((idx) => idx >= 0);
    if (urlIndices.length === 0) continue;

    const blocks = urlIndices.map((urlCol) => {
      const dateCol = row.indexOf("Post publish date", urlCol);
      const engCol = row.indexOf("Engagements", urlCol);
      const impCol = row.indexOf("Impressions", urlCol);
      return { urlCol, dateCol, metricCol: engCol >= 0 ? engCol : impCol, metricKey: engCol >= 0 ? "engagements" : "impressions" };
    });

    const engBlock = blocks.find((b) => b.metricKey === "engagements");
    const impBlock = blocks.find((b) => row[b.metricCol] === "Impressions" || b.metricKey === "impressions");

    const impBlockFixed = urlIndices.length > 1
      ? {
          urlCol: urlIndices[1],
          dateCol: row.indexOf("Post publish date", urlIndices[1]),
          metricCol: row.indexOf("Impressions", urlIndices[1]),
          metricKey: "impressions",
        }
      : null;

    return {
      rowIndex: i,
      engBlock: engBlock ?? null,
      impBlock: impBlockFixed?.metricCol >= 0 ? impBlockFixed : blocks.find((b) => b.metricCol >= 0 && row[b.metricCol] === "Impressions") ?? impBlockFixed,
    };
  }
  return null;
}

function parseTopPosts(rows) {
  const header = findTopPostsHeader(rows);
  if (!header) {
    throw new BackendError(422, "INVALID_XLSX", "TOP POSTS sheet missing expected headers");
  }

  const byUrl = new Map();
  const { rowIndex, engBlock, impBlock } = header;

  const applyBlock = (block) => {
    if (!block || block.urlCol == null || block.metricCol == null) return;
    for (let r = rowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row) continue;
      const url = row[block.urlCol];
      if (!url || typeof url !== "string" || !url.includes("linkedin")) continue;
      const key = normalizeUrl(url);
      const existing = byUrl.get(key) ?? {
        linkedinPostUrl: url.trim(),
        publishDate: null,
        impressions: null,
        engagements: null,
      };
      if (block.dateCol >= 0 && row[block.dateCol] != null) {
        existing.publishDate = parseDate(row[block.dateCol]);
      }
      const metric = row[block.metricCol];
      if (metric != null && metric !== "") {
        existing[block.metricKey] = Number(metric);
      }
      byUrl.set(key, existing);
    }
  };

  applyBlock(engBlock);
  applyBlock(impBlock);

  return [...byUrl.values()].map((p) => {
    let engagementRate = null;
    if (p.impressions > 0 && p.engagements != null) {
      engagementRate = p.engagements / p.impressions;
    }
    return { ...p, engagementRate };
  });
}

function parseDiscovery(rows) {
  const summary = {};
  for (const row of rows ?? []) {
    const label = row[0];
    const value = row[1];
    if (label === "Impressions") summary.impressions = Number(value);
    if (label === "Members reached") summary.membersReached = Number(value);
    if (label === "Overall Performance") summary.dateRange = value;
  }
  return summary;
}

function parseDateRange(discovery) {
  const dr = discovery?.dateRange;
  if (typeof dr !== "string" || !dr.includes(" - ")) return { start: null, end: null };
  const [a, b] = dr.split(" - ");
  return { start: parseDate(a?.trim()), end: parseDate(b?.trim()) };
}

/**
 * @param {Buffer} buffer
 */
export function parseLinkedInAnalyticsXlsx(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetNames = workbook.SheetNames;

  if (!sheetNames.includes("TOP POSTS")) {
    throw new BackendError(422, "INVALID_XLSX", "Missing required sheet: TOP POSTS");
  }

  const topRows = sheetToRows(workbook, "TOP POSTS");
  const posts = parseTopPosts(topRows);

  if (posts.length === 0) {
    throw new BackendError(422, "INVALID_XLSX", "No posts found in TOP POSTS sheet");
  }

  const warnings = [];
  const impressionsOnly = posts.filter((p) => p.engagements == null).length;
  if (impressionsOnly > 0) {
    warnings.push(`${impressionsOnly} posts have impressions only (engagements missing in export)`);
  }

  let discovery = {};
  if (sheetNames.includes("DISCOVERY")) {
    discovery = parseDiscovery(sheetToRows(workbook, "DISCOVERY"));
  }

  const { start, end } = parseDateRange(discovery);

  return {
    manifest: { sheets: sheetNames },
    discovery,
    dateRangeStart: start,
    dateRangeEnd: end,
    posts,
    warnings,
    rowCounts: {
      posts: posts.length,
      engagementDaily: sheetNames.includes("ENGAGEMENT")
        ? Math.max(0, (sheetToRows(workbook, "ENGAGEMENT")?.length ?? 0) - 1)
        : 0,
    },
  };
}
