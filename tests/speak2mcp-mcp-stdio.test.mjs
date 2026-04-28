import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("stdio MCP: initialize, list tools, call speak2_doctor", async () => {
  const transport = new StdioClientTransport({
    command: "node",
    args: [join(pkgRoot, "src", "server.mjs")],
    cwd: pkgRoot,
    stderr: "pipe",
  });

  const client = new Client({ name: "speak2mcp-integration", version: "0.0.1" });
  await client.connect(transport);

  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  assert.ok(names.includes("speak2_doctor"));
  assert.ok(names.includes("speak2_latest"));
  assert.ok(names.includes("bee_create"));

  const doctor = await client.callTool({
    name: "speak2_doctor",
    arguments: {},
  });
  assert.ok(doctor.content?.[0]?.type === "text");
  const payload = JSON.parse(doctor.content[0].text);
  assert.equal(typeof payload.transcript_path, "string");
  assert.equal(typeof payload.transcript_exists, "boolean");
  assert.equal(typeof payload.bee_bin_resolved, "string");

  await transport.close();
});
