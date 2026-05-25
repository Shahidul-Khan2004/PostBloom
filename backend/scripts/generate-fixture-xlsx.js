import * as XLSX from "xlsx";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "../test/fixtures/linkedin-sample.xlsx");

const wb = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ["Overall Performance", "1/1/2025 - 12/31/2025"],
    ["Impressions", 1000],
    ["Members reached", 500],
  ]),
  "DISCOVERY"
);

XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ["Date", "Impressions", "Engagements"],
    ["1/1/2025", 10, 2],
    ["1/2/2025", 20, 4],
  ]),
  "ENGAGEMENT"
);

XLSX.utils.book_append_sheet(
  wb,
  XLSX.utils.aoa_to_sheet([
    ["Maximum of 50 posts available to include in this list"],
    [],
    ["Post URL", "Post publish date", "Engagements", null, "Post URL", "Post publish date", "Impressions"],
    [
      "https://www.linkedin.com/feed/update/urn:li:activity:1000000000000000001",
      "6/1/2025",
      50,
      null,
      "https://www.linkedin.com/feed/update/urn:li:activity:1000000000000000001",
      "6/1/2025",
      5000,
    ],
    [
      "https://www.linkedin.com/feed/update/urn:li:activity:1000000000000000002",
      "5/1/2025",
      10,
      null,
      "https://www.linkedin.com/feed/update/urn:li:activity:1000000000000000002",
      "5/1/2025",
      800,
    ],
    [
      "https://www.linkedin.com/feed/update/urn:li:activity:1000000000000000003",
      "4/1/2025",
      2,
      null,
      "https://www.linkedin.com/feed/update/urn:li:activity:1000000000000000003",
      "4/1/2025",
      100,
    ],
  ]),
  "TOP POSTS"
);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
console.log("Wrote", out);
