# speak2mcp

**Repository:** [github.com/ishuru/speak2mcp](https://github.com/ishuru/speak2mcp)

Local **Model Context Protocol** (stdio) server that exposes:

- **Speak2** — reads `~/.speak2/transcriptions.jsonl` (JSONL lines with `ts`, `text`, `model`, `duration_ms`, `app`; newest-first helpers).
- **Bee** — `bee_create` tool runs `bee facts create` / `bee todos create` with `--json`.

Related upstreams for comparison:

- [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) — MCP server primitives.
- [aj47/SpeakMCP](https://github.com/aj47/SpeakMCP) — Electron voice + MCP (broader product).
- [fellowgeek/mcp-speak](https://github.com/fellowgeek/mcp-speak) — macOS `say` TTS MCP.

## Install

```bash
git clone https://github.com/ishuru/speak2mcp.git
cd speak2mcp
npm install
```

## Cursor MCP

Add to **Cursor MCP** config (e.g. `~/.cursor/mcp.json` or project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "speak2mcp": {
      "command": "node",
      "args": ["/ABS/PATH/TO/speak2mcp/src/server.mjs"],
      "env": {
        "SPEAK2_TRANSCRIPT_PATH": "",
        "BEE_BIN": ""
      }
    }
  }
}
```

Leave `SPEAK2_TRANSCRIPT_PATH` unset to use `~/.speak2/transcriptions.jsonl`. Set `BEE_BIN` if `bee` is not on `PATH`.

## Tools

| Tool | Purpose |
|------|---------|
| `speak2_latest` | Newest `limit` entries (default 20), newest first. |
| `speak2_since` | Entries newer than `since_iso`. |
| `speak2_steering_snapshot` | Latest line + `operator_directive` string for live steering. |
| `bee_create` | `{ "kind": "fact" \| "todo", "text": "..." }` |
| `speak2_doctor` | Transcript file exists? Bee binary path? |

## Resource

- `speak2://recent/transcripts` — JSON blob of last 30 entries.

## Claude Code / other clients

Same `command` + `args` as Cursor; any MCP stdio client works.

## Tests

```bash
npm test
```
