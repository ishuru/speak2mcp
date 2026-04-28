import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  readSpeak2TranscriptEntries,
  readEntriesSince,
  parseTranscriptLine,
} from "../lib/transcript.mjs";
import { buildBeeArgs, findBeeBinary } from "../lib/bee.mjs";

function fixtureDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "speak2mcp-"));
}

test("readSpeak2TranscriptEntries sorts newest first", () => {
  const dir = fixtureDir();
  const p = path.join(dir, "transcriptions.jsonl");
  try {
    fs.writeFileSync(
      p,
      [
        JSON.stringify({
          ts: "2026-04-18T15:00:00.000Z",
          model: "parakeet-v3",
          text: "Older",
          duration_ms: 100,
          app: "speak2",
        }),
        JSON.stringify({
          ts: "2026-04-18T15:00:05.000Z",
          model: "parakeet-v3",
          text: "Newer",
          duration_ms: 100,
          app: "speak2",
        }),
      ].join("\n") + "\n",
    );
    const entries = readSpeak2TranscriptEntries(p, 10);
    assert.equal(entries[0].text, "Newer");
    assert.equal(entries[1].text, "Older");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("readEntriesSince filters by timestamp", () => {
  const dir = fixtureDir();
  const p = path.join(dir, "t.jsonl");
  try {
    fs.writeFileSync(
      p,
      [
        JSON.stringify({
          ts: "2026-04-18T10:00:00.000Z",
          text: "A",
          duration_ms: 1,
          app: "speak2",
        }),
        JSON.stringify({
          ts: "2026-04-18T12:00:00.000Z",
          text: "B",
          duration_ms: 1,
          app: "speak2",
        }),
      ].join("\n") + "\n",
    );
    const filtered = readEntriesSince(p, "2026-04-18T11:00:00.000Z");
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].text, "B");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("parseTranscriptLine skips blanks and invalid JSON", () => {
  assert.equal(parseTranscriptLine(""), null);
  assert.equal(parseTranscriptLine("   "), null);
  assert.equal(parseTranscriptLine("{not json"), null);
});
test("buildBeeArgs matches bee CLI shape", () => {
  assert.deepEqual(buildBeeArgs("fact", "x"), [
    "facts",
    "create",
    "--text",
    "x",
    "--json",
  ]);
  assert.deepEqual(buildBeeArgs("todo", "y"), [
    "todos",
    "create",
    "--text",
    "y",
    "--json",
  ]);
});

test("findBeeBinary returns a string", () => {
  assert.equal(typeof findBeeBinary(), "string");
  assert.ok(findBeeBinary().length > 0);
});
