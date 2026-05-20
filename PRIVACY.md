# goblin Privacy

goblin is designed to run fully locally.

- It reads Codex state from the user's own machine.
- It does not upload Codex conversations, logs, project paths, process data, or source snippets.
- It does not include analytics, telemetry, crash reporting, advertising, or tracking SDKs.
- The Chrome extension has no host permissions and does not inject content scripts into web pages.
- The Native Host only handles fixed local API routes and rejects arbitrary paths, SQL, and shell commands.

Data sources are limited to:

- `~/.codex/state_5.sqlite`
- `~/.codex/logs_2.sqlite`
- `~/.codex/session_index.jsonl`
- `~/.codex/sessions/**`
- `~/.codex/shell_snapshots/**`

The extension UI communicates with the local Native Host through Chrome Native Messaging. All processing happens on the user's device.
