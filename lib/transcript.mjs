import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function defaultTranscriptPath() {
  return path.join(os.homedir(), ".speak2", "transcriptions.jsonl");
}

export function normalizeTranscriptText(text, model = "unknown") {
  let normalized = String(text ?? "").trim();

  if (/^parakeet/i.test(String(model))) {
    normalized = normalized
      .replace(/\[(music|applause|laughter|noise)\]/gi, " ")
      .replace(/\((music|applause|laughter|noise)\)/gi, " ")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;!?])/g, "$1")
      .trim();
  }

  return normalized;
}

export function parseTranscriptLine(line) {
  if (!line || !line.trim()) {
    return null;
  }

  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    return null;
  }
  return {
    ts: entry.ts ?? null,
    model: entry.model ?? "unknown",
    text: normalizeTranscriptText(entry.text ?? "", entry.model ?? "unknown"),
    durationMs: Number(entry.duration_ms ?? 0),
    app: entry.app ?? "speak2",
  };
}

function parseAllEntries(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map(parseTranscriptLine)
    .filter(Boolean)
    .sort((left, right) => {
      const leftTs = left.ts ? Date.parse(left.ts) : 0;
      const rightTs = right.ts ? Date.parse(right.ts) : 0;
      return rightTs - leftTs;
    });
}

export function readSpeak2TranscriptEntries(filePath = defaultTranscriptPath(), limit = 50) {
  return parseAllEntries(filePath).slice(0, limit);
}

export function readEntriesSince(filePath, sinceIso) {
  const sinceMs = sinceIso ? Date.parse(sinceIso) : 0;
  const all = parseAllEntries(filePath);
  if (!sinceMs || Number.isNaN(sinceMs)) {
    return all;
  }
  return all.filter((e) => {
    const t = e.ts ? Date.parse(e.ts) : 0;
    return t > sinceMs;
  });
}
