import * as XLSX from "xlsx";

/**
 * @param {Date|string|number|null} value
 * @returns {string|null} YYYY-MM-DD
 */
export function formatDateOnly(value) {
  if (value == null || value === "") return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const usMatch = typeof value === "string" && value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }

  if (typeof value === "number") {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }

  let date;
  if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * @param {Date|string|null|undefined} value
 * @returns {string|null}
 */
export function toApiDateOnly(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return formatDateOnly(value);
}
