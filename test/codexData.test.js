const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  parseProcessUuid,
  parsePsLine,
  normalizeRolloutLine,
  parseRolloutFile,
  buildProjects,
} = require("../src/codexData");

test("parseProcessUuid reads Codex pid process identifiers", () => {
  assert.deepEqual(parseProcessUuid("pid:14987:e3af3aea"), {
    pid: 14987,
    instanceId: "e3af3aea",
  });
  assert.deepEqual(parseProcessUuid("service-only"), {
    pid: null,
    instanceId: "service-only",
  });
});

test("parsePsLine keeps the full command tail", () => {
  assert.deepEqual(parsePsLine("14987 14911 S 08:52:58 0.1 0.4 /Applications/Codex app-server"), {
    pid: 14987,
    ppid: 14911,
    stat: "S",
    etime: "08:52:58",
    pcpu: 0.1,
    pmem: 0.4,
    command: "/Applications/Codex app-server",
  });
});

test("normalizeRolloutLine turns messages and tool calls into timeline events", () => {
  const message = normalizeRolloutLine({
    timestamp: "2026-05-20T12:00:00Z",
    type: "response_item",
    payload: {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: "hello" }],
    },
  });
  assert.equal(message.category, "message");
  assert.equal(message.actor, "assistant");
  assert.equal(message.text, "hello");

  const tool = normalizeRolloutLine({
    timestamp: "2026-05-20T12:01:00Z",
    type: "response_item",
    payload: {
      type: "function_call",
      name: "exec_command",
      arguments: "{\"cmd\":\"git status --short\"}",
    },
  });
  assert.equal(tool.category, "tool");
  assert.equal(tool.toolName, "exec_command");
  assert.equal(tool.text, "git status --short");
});

test("parseRolloutFile skips developer chatter but counts useful events", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-overview-"));
  const file = path.join(dir, "rollout.jsonl");
  fs.writeFileSync(
    file,
    [
      JSON.stringify({
        timestamp: "2026-05-20T12:00:00Z",
        type: "response_item",
        payload: { type: "message", role: "developer", content: [{ text: "hidden" }] },
      }),
      JSON.stringify({
        timestamp: "2026-05-20T12:00:01Z",
        type: "response_item",
        payload: { type: "message", role: "user", content: [{ text: "show me" }] },
      }),
      JSON.stringify({
        timestamp: "2026-05-20T12:00:02Z",
        type: "response_item",
        payload: { type: "function_call_output", output: "Process exited with code 0\nOK" },
      }),
    ].join("\n"),
  );

  const parsed = parseRolloutFile(file);
  assert.equal(parsed.exists, true);
  assert.equal(parsed.stats.totalEvents, 2);
  assert.equal(parsed.timeline.length, 2);
  assert.equal(parsed.timeline[0].actor, "user");
  assert.equal(parsed.timeline[1].exitCode, 0);
});

test("buildProjects aggregates threads, processes, and shell snapshots", () => {
  const projects = buildProjects(
    [
      {
        id: "t1",
        cwd: "/repo/alpha",
        title: "Alpha work",
        updatedAtMs: 2000,
        createdAtMs: 1000,
        updatedAt: "1970-01-01T00:00:02.000Z",
        tokensUsed: 12,
        archived: false,
        model: "gpt-test",
        gitBranch: "main",
        gitOriginUrl: "git@example.com:alpha.git",
      },
    ],
    [{ threadId: "t1", processUuid: "pid:77:abc", logCount: 4, firstTs: 1, lastTs: 2 }],
    [{ threadId: "t1", file: "t1.1.sh" }],
    {
      available: true,
      rows: {
        77: {
          pid: 77,
          ppid: 1,
          stat: "S",
          etime: "00:01",
          pcpu: 0,
          pmem: 0.1,
          command: "codex app-server",
        },
      },
    },
  );

  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, "alpha");
  assert.equal(projects[0].threadCount, 1);
  assert.equal(projects[0].activeProcessCount, 1);
  assert.equal(projects[0].shellSnapshotCount, 1);
  assert.equal(projects[0].threads[0].logProcessCount, 1);
});
