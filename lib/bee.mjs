import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function findBeeBinary() {
  const candidates = [
    process.env.BEE_BIN,
    path.join(os.homedir(), ".local", "bin", "bee"),
    "/opt/homebrew/bin/bee",
    "bee",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === "bee" || fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return "bee";
}

export function buildBeeArgs(kind, text) {
  const normalized = String(kind).toLowerCase();
  if (normalized === "fact") {
    return ["facts", "create", "--text", text, "--json"];
  }
  if (normalized === "todo") {
    return ["todos", "create", "--text", text, "--json"];
  }
  throw new Error(`Unsupported Bee kind: ${kind} (use fact or todo)`);
}

export function runBee(kind, text) {
  const bin = findBeeBinary();
  const args = buildBeeArgs(kind, text);
  const result = spawnSync(bin, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    bin,
    args,
  };
}
