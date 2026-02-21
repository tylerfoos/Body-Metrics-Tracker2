import { MeasurementEntry } from "./types";
import * as Crypto from "expo-crypto";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const HEALTH_EXPORT_MAP: Record<string, string> = {
  "Active Calories": "activeCalories",
  "Blood Oxygen": "bloodOxygen",
  "Body Fat": "bodyFat",
  "Body Mass Index": "bmi",
  "Heart Rate": "heartRate",
  "Heart Rate Variability": "hrv",
  "Resting Calories": "restingCalories",
  "Resting Heart Rate": "restingHeartRate",
  Sleep: "sleep",
  "Walking Heart Rate": "walkingHeartRate",
  Weight: "weight",
};

function cleanHeaderName(header: string): string {
  return header.replace(/\s*\(.*?\)\s*$/, "").trim();
}

function parseValue(val: string): number | string | null {
  if (!val || val === "-" || val === "") return null;
  const cleaned = val.replace(/,/g, "");
  if (cleaned.includes("-") && !cleaned.startsWith("-")) {
    return val;
  }
  const num = parseFloat(cleaned);
  if (!isNaN(num)) return num;
  return val;
}

function parseSleepToHours(val: string): number | null {
  const match = val.match(/(\d+)h\s*(\d+)?m?/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    return Math.round((hours + minutes / 60) * 100) / 100;
  }
  return null;
}

export function parseHealthExportCsv(csvText: string): MeasurementEntry[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  const cleanHeaders = headers.map(cleanHeaderName);

  const entries: MeasurementEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const dateStr = cols[0].replace(/"/g, "");
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;

    const isoDate = date.toISOString().split("T")[0];
    const values: Record<string, number | string> = {};

    for (let j = 1; j < cleanHeaders.length && j < cols.length; j++) {
      const headerName = cleanHeaders[j];
      const mappedKey = HEALTH_EXPORT_MAP[headerName];
      if (!mappedKey) continue;

      const rawVal = cols[j].replace(/"/g, "");
      if (mappedKey === "sleep") {
        const hours = parseSleepToHours(rawVal);
        if (hours !== null) values[mappedKey] = hours;
        continue;
      }

      const parsed = parseValue(rawVal);
      if (parsed !== null) {
        values[mappedKey] = parsed;
      }
    }

    if (Object.keys(values).length > 0) {
      entries.push({
        id: Crypto.randomUUID(),
        date: isoDate,
        timestamp: date.getTime(),
        values,
      });
    }
  }

  return entries;
}

export function exportToCsv(entries: MeasurementEntry[]): string {
  if (entries.length === 0) return "";

  const allKeys = new Set<string>();
  entries.forEach((e) => Object.keys(e.values).forEach((k) => allKeys.add(k)));
  const keys = Array.from(allKeys).sort();

  const header = ["Date", ...keys].join(",");
  const rows = entries
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((entry) => {
      const dateStr = entry.date;
      const vals = keys.map((k) => {
        const v = entry.values[k];
        if (v === undefined || v === null) return "";
        return typeof v === "string" && v.includes(",") ? `"${v}"` : String(v);
      });
      return [dateStr, ...vals].join(",");
    });

  return [header, ...rows].join("\n");
}
