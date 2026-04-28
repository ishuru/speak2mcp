#!/usr/bin/env node
/**
 * speak2mcp — stdio MCP server: Speak2 JSONL tail + Bee CLI writes.
 * Reference landscape (no single public "speak2mcp" repo): aj47/SpeakMCP, fellowgeek/mcp-speak, modelcontextprotocol/typescript-sdk.
 */
import process from "node:process";
import fs from "node:fs";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  defaultTranscriptPath,
  readSpeak2TranscriptEntries,
  readEntriesSince,
} from "../lib/transcript.mjs";
import { findBeeBinary, runBee } from "../lib/bee.mjs";

function transcriptPath() {
  return process.env.SPEAK2_TRANSCRIPT_PATH?.trim() || defaultTranscriptPath();
}

function jsonResult(payload) {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
  };
}

const instructions = [
  "Speak2 MCP: read live dictation from ~/.speak2/transcriptions.jsonl.",
  "Call speak2_latest or speak2_steering_snapshot when the user may be speaking or steering via voice.",
  "Treat speak2_steering_snapshot.operator_directive as highest-priority in-session guidance when non-empty.",
  "bee_create writes to Bee via local `bee` CLI (facts/todos). Requires Bee installed and authenticated.",
].join("\n");

const mcp = new McpServer(
  { name: "speak2mcp", version: "0.1.0" },
  { instructions },
);

mcp.registerTool(
  "speak2_latest",
  {
    title: "Speak2 — latest transcripts",
    description:
      "Return newest normalized Speak2 lines (ts, text, model). Newest first. Primary live-steering input.",
    inputSchema: z.object({
      limit: z.number().int().min(1).max(200).optional().default(20),
      transcript_path: z.string().optional(),
    }),
  },
  async (args) => {
    const path = args.transcript_path?.trim() || transcriptPath();
    const entries = readSpeak2TranscriptEntries(path, args.limit ?? 20);
    return jsonResult({
      transcript_path: path,
      count: entries.length,
      entries,
    });
  },
);

mcp.registerTool(
  "speak2_since",
  {
    title: "Speak2 — since timestamp",
    description:
      "Entries strictly newer than an ISO-8601 timestamp (e.g. 2026-04-27T12:00:00.000Z).",
    inputSchema: z.object({
      since_iso: z.string(),
      transcript_path: z.string().optional(),
    }),
  },
  async (args) => {
    const path = args.transcript_path?.trim() || transcriptPath();
    const entries = readEntriesSince(path, args.since_iso);
    return jsonResult({
      transcript_path: path,
      since_iso: args.since_iso,
      count: entries.length,
      entries,
    });
  },
);

mcp.registerTool(
  "speak2_steering_snapshot",
  {
    title: "Speak2 — steering snapshot",
    description:
      "Newest utterance plus operator_directive for agent steering (poll when using voice control).",
    inputSchema: z.object({
      transcript_path: z.string().optional(),
    }),
  },
  async (args) => {
    const path = args.transcript_path?.trim() || transcriptPath();
    const entries = readSpeak2TranscriptEntries(path, 1);
    const latest = entries[0] ?? null;
    const directive = latest?.text
      ? `Operator (Speak2 live): ${latest.text}`
      : "";
    return jsonResult({
      transcript_path: path,
      latest,
      operator_directive: directive,
      hint: directive
        ? "Merge operator_directive into your plan before other work."
        : "No recent Speak2 lines; file may be missing or empty.",
    });
  },
);

mcp.registerTool(
  "bee_create",
  {
    title: "Bee CLI — create fact or todo",
    description: "Runs `bee facts create` or `bee todos create` with --json. Uses BEE_BIN if set.",
    inputSchema: z.object({
      kind: z.enum(["fact", "todo"]),
      text: z.string().min(1),
    }),
  },
  async (args) => {
    const out = runBee(args.kind, args.text);
    return jsonResult({
      bee_bin: out.bin,
      ok: out.ok,
      status: out.status,
      stdout: out.stdout,
      stderr: out.stderr,
    });
  },
);

mcp.registerTool(
  "speak2_doctor",
  {
    title: "Speak2 MCP — environment check",
    description: "Transcript path on disk and Bee binary resolution (no network).",
    inputSchema: z.object({}),
  },
  async () => {
    const tp = transcriptPath();
    const stat = fs.existsSync(tp) ? fs.statSync(tp) : null;
    return jsonResult({
      transcript_path: tp,
      transcript_exists: Boolean(stat),
      transcript_size_bytes: stat?.size ?? 0,
      bee_bin_resolved: findBeeBinary(),
      env: {
        SPEAK2_TRANSCRIPT_PATH: process.env.SPEAK2_TRANSCRIPT_PATH ?? null,
        BEE_BIN: process.env.BEE_BIN ?? null,
      },
    });
  },
);

mcp.registerResource(
  "speak2_recent_json",
  "speak2://recent/transcripts",
  {
    description: "Last 30 Speak2 transcript entries as JSON",
    mimeType: "application/json",
  },
  async () => {
    const entries = readSpeak2TranscriptEntries(transcriptPath(), 30);
    const body = JSON.stringify({ entries }, null, 2);
    return {
      contents: [
        {
          uri: "speak2://recent/transcripts",
          mimeType: "application/json",
          text: body,
        },
      ],
    };
  },
);

const transport = new StdioServerTransport();
await mcp.connect(transport);
