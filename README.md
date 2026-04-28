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

This repo ships **`.cursor/mcp.json`** (tracked) so the server starts when the **workspace root is the Duality volume** (`☯Duality`). Cursor expands `${workspaceFolder}` in `args`.

1. Open the folder **`/Volumes/☯Duality`** (or your clone of `shadow-root`) as the workspace root — not a subfolder only.
2. **Reload / restart Cursor** after pulling so MCP picks up the config.
3. Enable the **speak2mcp** server in Cursor Settings → MCP (toggle on if listed disabled).
4. Smoke test: run tool **`speak2_doctor`** in the MCP panel; you should see `transcript_path`, `transcript_exists`, and `bee_bin_resolved`.

If you use another workspace root, copy the `speak2mcp` block into `~/.cursor/mcp.json` and set `args` to an absolute path to `src/server.mjs`.

Optional `env` on the server entry:

```json
"env": {
  "SPEAK2_TRANSCRIPT_PATH": "/custom/path/transcriptions.jsonl",
  "BEE_BIN": "/opt/homebrew/bin/bee"
}
```

Leave `SPEAK2_TRANSCRIPT_PATH` unset to use `~/.speak2/transcriptions.jsonl`. Set `BEE_BIN` if `bee` is not on `PATH`.

### Verify from terminal

```bash
cd speak2mcp && npm test
```

The `stdio MCP` test boots the real server and calls `speak2_doctor` over JSON-RPC.

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
