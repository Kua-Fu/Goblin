const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

const CODEX_HOME = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
const STATE_DB = process.env.CODEX_STATE_DB || path.join(CODEX_HOME, "state_5.sqlite");
const LOGS_DB = process.env.CODEX_LOGS_DB || path.join(CODEX_HOME, "logs_2.sqlite");
const SESSION_INDEX = process.env.CODEX_SESSION_INDEX || path.join(CODEX_HOME, "session_index.jsonl");
const SHELL_SNAPSHOTS_DIR =
  process.env.CODEX_SHELL_SNAPSHOTS_DIR || path.join(CODEX_HOME, "shell_snapshots");

const SQLITE_MAX_BUFFER = 64 * 1024 * 1024;
const MAX_TIMELINE_EVENTS = 1600;
const MAX_LOGS_PER_THREAD = 120;
const MAX_THREADS_PER_PROJECT_DETAIL = 500;

function sqlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function sqliteJson(dbPath, sql) {
  if (!fs.existsSync(dbPath)) {
    return [];
  }

  const { stdout } = await execFileAsync("sqlite3", ["-json", dbPath, sql], {
    maxBuffer: SQLITE_MAX_BUFFER,
  });
  const text = stdout.trim();
  return text ? JSON.parse(text) : [];
}

function timestampMs(row, msField, secondField) {
  const ms = Number(row[msField]);
  if (Number.isFinite(ms) && ms > 0) {
    return ms;
  }

  const seconds = Number(row[secondField]);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

function isoFromMs(value) {
  const ms = Number(value);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : null;
}

function isoFromSeconds(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000).toISOString() : null;
}

function basenameFromCwd(cwd) {
  if (!cwd) {
    return "Unknown";
  }
  const normalized = cwd.replace(/\/+$/, "");
  return path.basename(normalized) || normalized;
}

function shortText(value, limit = 420) {
  if (value == null) {
    return "";
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit - 1)}...`;
}

function normalizeThread(row) {
  const createdAtMs = timestampMs(row, "created_at_ms", "created_at");
  const updatedAtMs = timestampMs(row, "updated_at_ms", "updated_at");
  const title = row.title || row.thread_name || shortText(row.first_user_message || row.preview, 90);

  return {
    id: row.id,
    title: title || "Untitled conversation",
    cwd: row.cwd || "",
    projectName: basenameFromCwd(row.cwd),
    createdAtMs,
    updatedAtMs,
    createdAt: isoFromMs(createdAtMs),
    updatedAt: isoFromMs(updatedAtMs),
    source: row.source || row.thread_source || "",
    threadSource: row.thread_source || "",
    model: row.model || "",
    modelProvider: row.model_provider || "",
    reasoningEffort: row.reasoning_effort || "",
    tokensUsed: Number(row.tokens_used || 0),
    archived: Boolean(row.archived),
    gitBranch: row.git_branch || "",
    gitOriginUrl: row.git_origin_url || "",
    rolloutPath: row.rollout_path || "",
    preview: shortText(row.preview || row.first_user_message || "", 520),
  };
}

async function getThreads(whereSql = "", limitSql = "") {
  const sql = `
    select
      id, rollout_path, created_at, updated_at, source, model_provider, cwd, title,
      tokens_used, archived, git_sha, git_branch, git_origin_url, cli_version,
      first_user_message, agent_nickname, agent_role, memory_mode, model,
      reasoning_effort, thread_source, preview, created_at_ms, updated_at_ms
    from threads
    ${whereSql}
    order by coalesce(updated_at_ms, updated_at * 1000) desc, id desc
    ${limitSql}
  `;
  const rows = await sqliteJson(STATE_DB, sql);
  return rows.map(normalizeThread);
}

async function getAllThreads() {
  return getThreads();
}

async function getThreadsForProject(cwd) {
  return getThreads(`where cwd = ${sqlQuote(cwd)}`, `limit ${MAX_THREADS_PER_PROJECT_DETAIL}`);
}

async function getThreadById(threadId) {
  const rows = await getThreads(`where id = ${sqlQuote(threadId)}`, "limit 1");
  return rows[0] || null;
}

async function getThreadProcessRows(threadId = null) {
  const where = threadId
    ? `where thread_id = ${sqlQuote(threadId)} and process_uuid is not null`
    : "where process_uuid is not null";
  return sqliteJson(
    LOGS_DB,
    `
      select
        thread_id as threadId,
        process_uuid as processUuid,
        count(*) as logCount,
        min(ts) as firstTs,
        max(ts) as lastTs,
        group_concat(distinct level) as levels
      from logs
      ${where}
      group by thread_id, process_uuid
      order by max(ts) desc
      limit 2000
    `,
  );
}

async function getProcessRows() {
  return sqliteJson(
    LOGS_DB,
    `
      select
        process_uuid as processUuid,
        count(*) as logCount,
        count(distinct thread_id) as threadCount,
        min(ts) as firstTs,
        max(ts) as lastTs,
        group_concat(distinct level) as levels
      from logs
      where process_uuid is not null
      group by process_uuid
      order by max(ts) desc
      limit 500
    `,
  );
}

async function getRecentLogsForThread(threadId) {
  return sqliteJson(
    LOGS_DB,
    `
      select
        ts, ts_nanos as tsNanos, level, target,
        substr(feedback_log_body, 1, 900) as body,
        module_path as modulePath, file, line,
        process_uuid as processUuid
      from logs
      where thread_id = ${sqlQuote(threadId)}
      order by ts desc, ts_nanos desc, id desc
      limit ${MAX_LOGS_PER_THREAD}
    `,
  ).then((rows) =>
    rows.map((row) => ({
      ...row,
      at: isoFromSeconds(row.ts),
      body: shortText(row.body, 900),
    })),
  );
}

function parseProcessUuid(processUuid) {
  const match = /^pid:(\d+):(.+)$/.exec(processUuid || "");
  if (!match) {
    return { pid: null, instanceId: processUuid || "" };
  }
  return {
    pid: Number(match[1]),
    instanceId: match[2],
  };
}

function parsePsLine(line) {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 6) {
    return null;
  }
  const [pid, ppid, stat, etime, pcpu, pmem, ...commandParts] = parts;
  return {
    pid: Number(pid),
    ppid: Number(ppid),
    stat,
    etime,
    pcpu: Number(pcpu),
    pmem: Number(pmem),
    command: commandParts.join(" "),
  };
}

async function getProcessTable(pids) {
  const uniquePids = [...new Set(pids.filter(Boolean).map(Number))].filter(Number.isFinite);
  if (uniquePids.length === 0) {
    return { available: true, rows: {}, error: null };
  }

  try {
    const { stdout } = await execFileAsync(
      "ps",
      [
        "-p",
        uniquePids.join(","),
        "-o",
        "pid=",
        "-o",
        "ppid=",
        "-o",
        "stat=",
        "-o",
        "etime=",
        "-o",
        "pcpu=",
        "-o",
        "pmem=",
        "-o",
        "command=",
      ],
      { maxBuffer: 1024 * 1024 },
    );

    const rows = {};
    for (const line of stdout.split("\n")) {
      const parsed = parsePsLine(line);
      if (parsed) {
        rows[parsed.pid] = parsed;
      }
    }
    return { available: true, rows, error: null };
  } catch (error) {
    const rows = {};
    for (const line of String(error.stdout || "").split("\n")) {
      const parsed = parsePsLine(line);
      if (parsed) {
        rows[parsed.pid] = parsed;
      }
    }

    return {
      available: Object.keys(rows).length > 0,
      rows,
      error: error.message,
    };
  }
}

function listShellSnapshots() {
  if (!fs.existsSync(SHELL_SNAPSHOTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SHELL_SNAPSHOTS_DIR)
    .map((file) => {
      const match = /^([0-9a-f-]{36})\.(\d+)\.sh$/.exec(file);
      if (!match) {
        return null;
      }

      const stat = fs.statSync(path.join(SHELL_SNAPSHOTS_DIR, file));
      return {
        threadId: match[1],
        capturedAtNs: match[2],
        file,
        path: path.join(SHELL_SNAPSHOTS_DIR, file),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        mtime: stat.mtime.toISOString(),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function groupSnapshotsByThread(snapshots) {
  const byThread = new Map();
  for (const snapshot of snapshots) {
    if (!byThread.has(snapshot.threadId)) {
      byThread.set(snapshot.threadId, []);
    }
    byThread.get(snapshot.threadId).push(snapshot);
  }
  return byThread;
}

function processSummary(row, processTable) {
  const parsed = parseProcessUuid(row.processUuid);
  const live = parsed.pid ? processTable.rows[parsed.pid] : null;
  return {
    processUuid: row.processUuid,
    pid: parsed.pid,
    instanceId: parsed.instanceId,
    active: Boolean(live),
    command: live ? live.command : "",
    stat: live ? live.stat : "",
    etime: live ? live.etime : "",
    pcpu: live ? live.pcpu : null,
    pmem: live ? live.pmem : null,
    logCount: Number(row.logCount || 0),
    threadCount: Number(row.threadCount || 0),
    threadId: row.threadId || null,
    levels: row.levels ? String(row.levels).split(",") : [],
    firstAt: isoFromSeconds(row.firstTs),
    lastAt: isoFromSeconds(row.lastTs),
    firstTs: Number(row.firstTs || 0),
    lastTs: Number(row.lastTs || 0),
  };
}

function buildProjects(threads, threadProcessRows, snapshots, processTable) {
  const snapshotsByThread = groupSnapshotsByThread(snapshots);
  const processesByThread = new Map();
  for (const row of threadProcessRows) {
    if (!row.threadId) {
      continue;
    }
    if (!processesByThread.has(row.threadId)) {
      processesByThread.set(row.threadId, []);
    }
    processesByThread.get(row.threadId).push(processSummary(row, processTable));
  }

  const projects = new Map();
  for (const thread of threads) {
    const key = thread.cwd || "(no cwd)";
    if (!projects.has(key)) {
      projects.set(key, {
        cwd: key,
        name: basenameFromCwd(key),
        threadCount: 0,
        archivedCount: 0,
        tokensUsed: 0,
        lastUpdatedMs: 0,
        createdAtMs: Number.MAX_SAFE_INTEGER,
        models: new Set(),
        branches: new Set(),
        remotes: new Set(),
        processes: new Map(),
        shellSnapshotCount: 0,
        threads: [],
      });
    }

    const project = projects.get(key);
    const threadProcesses = processesByThread.get(thread.id) || [];
    const threadSnapshots = snapshotsByThread.get(thread.id) || [];
    project.threadCount += 1;
    project.archivedCount += thread.archived ? 1 : 0;
    project.tokensUsed += thread.tokensUsed;
    project.lastUpdatedMs = Math.max(project.lastUpdatedMs, thread.updatedAtMs || 0);
    project.createdAtMs = Math.min(project.createdAtMs, thread.createdAtMs || project.createdAtMs);
    if (thread.model) project.models.add(thread.model);
    if (thread.gitBranch) project.branches.add(thread.gitBranch);
    if (thread.gitOriginUrl) project.remotes.add(thread.gitOriginUrl);
    project.shellSnapshotCount += threadSnapshots.length;

    for (const proc of threadProcesses) {
      if (!project.processes.has(proc.processUuid)) {
        project.processes.set(proc.processUuid, { ...proc, logCount: 0, threadIds: new Set() });
      }
      const aggregate = project.processes.get(proc.processUuid);
      aggregate.logCount += proc.logCount;
      aggregate.threadIds.add(thread.id);
      aggregate.active = aggregate.active || proc.active;
      aggregate.lastTs = Math.max(aggregate.lastTs || 0, proc.lastTs || 0);
      aggregate.lastAt = isoFromSeconds(aggregate.lastTs);
    }

    project.threads.push({
      ...thread,
      logProcessCount: threadProcesses.length,
      shellSnapshotCount: threadSnapshots.length,
    });
  }

  return [...projects.values()]
    .map((project) => {
      const processes = [...project.processes.values()].map((proc) => ({
        ...proc,
        threadCount: proc.threadIds.size,
        threadIds: [...proc.threadIds],
      }));
      const activeProcessCount = processes.filter((proc) => proc.active).length;
      const newestLogTs = Math.max(0, ...processes.map((proc) => proc.lastTs || 0));

      return {
        cwd: project.cwd,
        name: project.name,
        threadCount: project.threadCount,
        archivedCount: project.archivedCount,
        tokensUsed: project.tokensUsed,
        lastUpdatedMs: project.lastUpdatedMs,
        lastUpdatedAt: isoFromMs(project.lastUpdatedMs),
        createdAt: isoFromMs(project.createdAtMs),
        models: [...project.models],
        branches: [...project.branches],
        remotes: [...project.remotes],
        processCount: processes.length,
        activeProcessCount,
        shellSnapshotCount: project.shellSnapshotCount,
        lastLogAt: isoFromSeconds(newestLogTs),
        status: activeProcessCount > 0 ? "active" : Date.now() - project.lastUpdatedMs < 86400000 ? "recent" : "idle",
        processes,
        threads: project.threads.sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0)),
      };
    })
    .sort((a, b) => (b.lastUpdatedMs || 0) - (a.lastUpdatedMs || 0));
}

function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => item.text || item.input_text || item.output_text || "")
    .filter(Boolean)
    .join("\n");
}

function parseJsonMaybe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function summarizeFunctionCall(payload) {
  const args = parseJsonMaybe(payload.arguments || "{}") || {};
  const preferred =
    args.cmd ||
    args.command ||
    args.q ||
    args.path ||
    args.url ||
    args.message ||
    args.code ||
    args.ref_id ||
    args.target ||
    payload.arguments ||
    "";
  return {
    label: payload.name || "tool",
    text: shortText(preferred, 520),
    rawArguments: args,
  };
}

function normalizeRolloutLine(row) {
  const payload = row.payload || {};
  const timestamp = row.timestamp || payload.timestamp || null;

  if (row.type === "session_meta") {
    return {
      timestamp,
      category: "meta",
      actor: "system",
      label: "session",
      text: shortText(`${payload.cwd || ""} ${payload.cli_version || ""}`, 260),
    };
  }

  if (payload.type === "message") {
    const text = extractTextContent(payload.content);
    return {
      timestamp,
      category: "message",
      actor: payload.role || "message",
      label: payload.role || "message",
      text: shortText(text, 1200),
    };
  }

  if (payload.type === "function_call") {
    const summary = summarizeFunctionCall(payload);
    return {
      timestamp,
      category: "tool",
      actor: "tool",
      label: summary.label,
      text: summary.text,
      toolName: payload.name || "",
      callId: payload.call_id || "",
    };
  }

  if (payload.type === "function_call_output") {
    const output = payload.output || "";
    const exitCodeMatch = /Process exited with code (-?\d+)/.exec(output);
    return {
      timestamp,
      category: "output",
      actor: "tool",
      label: exitCodeMatch ? `exit ${exitCodeMatch[1]}` : "output",
      text: shortText(output, 900),
      exitCode: exitCodeMatch ? Number(exitCodeMatch[1]) : null,
      callId: payload.call_id || "",
    };
  }

  if (payload.type === "user_message" || payload.type === "agent_message") {
    return {
      timestamp,
      category: "message",
      actor: payload.type === "user_message" ? "user" : "assistant",
      label: payload.type === "user_message" ? "user" : "assistant",
      text: shortText(payload.message || "", 1200),
    };
  }

  if (payload.type === "token_count") {
    return {
      timestamp,
      category: "metric",
      actor: "system",
      label: "tokens",
      text: shortText(JSON.stringify(payload.info || payload.rate_limits || {}), 420),
    };
  }

  if (payload.type === "reasoning") {
    return {
      timestamp,
      category: "reasoning",
      actor: "assistant",
      label: "reasoning",
      text: "",
    };
  }

  return {
    timestamp,
    category: "event",
    actor: "system",
    label: payload.type || row.type || "event",
    text: shortText(payload.message || payload.name || JSON.stringify(payload), 520),
  };
}

function parseRolloutFile(filePath, options = {}) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {
      exists: false,
      path: filePath || "",
      truncated: false,
      stats: {
        totalEvents: 0,
        categories: {},
        roles: {},
        tools: {},
      },
      timeline: [],
    };
  }

  const maxEvents = options.maxEvents || MAX_TIMELINE_EVENTS;
  const lines = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  const timeline = [];
  const stats = {
    totalEvents: 0,
    categories: {},
    roles: {},
    tools: {},
  };
  const hiddenRuntimeLabels = new Set(["turn_context", "task_started", "tokens"]);
  let lastEventKey = "";

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }

    const event = normalizeRolloutLine(row);
    // Codex 的 rollout 里包含大量系统和开发者上下文，这里保守展示摘要，
    // 避免可视化页面一打开就被系统提示词或完整工具输出淹没。
    if (
      (event.category === "message" && event.actor === "developer") ||
      (event.category === "message" && event.text.startsWith("<environment_context>")) ||
      event.category === "meta" ||
      event.category === "metric" ||
      event.category === "reasoning" ||
      hiddenRuntimeLabels.has(event.label)
    ) {
      continue;
    }

    const eventKey = `${event.timestamp}|${event.category}|${event.actor}|${event.label}|${event.text}`;
    if (eventKey === lastEventKey) {
      continue;
    }
    lastEventKey = eventKey;

    stats.totalEvents += 1;
    stats.categories[event.category] = (stats.categories[event.category] || 0) + 1;
    stats.roles[event.actor] = (stats.roles[event.actor] || 0) + 1;
    if (event.toolName) {
      stats.tools[event.toolName] = (stats.tools[event.toolName] || 0) + 1;
    }
    if (timeline.length < maxEvents) {
      timeline.push(event);
    }
  }

  return {
    exists: true,
    path: filePath,
    truncated: timeline.length < stats.totalEvents,
    stats,
    timeline,
  };
}

function readSessionIndexCount() {
  if (!fs.existsSync(SESSION_INDEX)) {
    return 0;
  }
  return fs.readFileSync(SESSION_INDEX, "utf8").split("\n").filter(Boolean).length;
}

function sourceFile(pathname) {
  if (!pathname || !fs.existsSync(pathname)) {
    return { path: pathname, exists: false, size: 0, updatedAt: null };
  }
  const stat = fs.statSync(pathname);
  return {
    path: pathname,
    exists: true,
    size: stat.size,
    updatedAt: stat.mtime.toISOString(),
  };
}

function getSourceInfo() {
  return {
    codexHome: CODEX_HOME,
    files: {
      stateDb: sourceFile(STATE_DB),
      logsDb: sourceFile(LOGS_DB),
      sessionIndex: sourceFile(SESSION_INDEX),
      shellSnapshotsDir: sourceFile(SHELL_SNAPSHOTS_DIR),
    },
    sessionIndexCount: readSessionIndexCount(),
  };
}

async function collectOverview() {
  const [threads, threadProcessRows, processRows] = await Promise.all([
    getAllThreads(),
    getThreadProcessRows(),
    getProcessRows(),
  ]);
  const pids = processRows.map((row) => parseProcessUuid(row.processUuid).pid);
  const processTable = await getProcessTable(pids);
  const snapshots = listShellSnapshots();
  const projects = buildProjects(threads, threadProcessRows, snapshots, processTable);
  const processes = processRows.map((row) => processSummary(row, processTable));

  return {
    generatedAt: new Date().toISOString(),
    sources: getSourceInfo(),
    stats: {
      projectCount: projects.length,
      threadCount: threads.length,
      archivedThreadCount: threads.filter((thread) => thread.archived).length,
      tokenCount: threads.reduce((sum, thread) => sum + thread.tokensUsed, 0),
      processCount: processes.length,
      activeProcessCount: processes.filter((process) => process.active).length,
      shellSnapshotCount: snapshots.length,
      processLookupAvailable: processTable.available,
      processLookupError: processTable.error,
    },
    projects,
    recentThreads: threads.slice(0, 20),
    processes: processes.slice(0, 120),
  };
}

async function getProjectDetail(cwd) {
  const [threads, threadProcessRows] = await Promise.all([
    getThreadsForProject(cwd),
    getThreadProcessRows(),
  ]);
  const relatedRows = threadProcessRows.filter((row) =>
    threads.some((thread) => thread.id === row.threadId),
  );
  const pids = relatedRows.map((row) => parseProcessUuid(row.processUuid).pid);
  const processTable = await getProcessTable(pids);
  const snapshots = listShellSnapshots();
  const projects = buildProjects(threads, relatedRows, snapshots, processTable);
  return projects[0] || {
    cwd,
    name: basenameFromCwd(cwd),
    threadCount: 0,
    threads: [],
    processes: [],
  };
}

async function getThreadDetail(threadId) {
  const [thread, processRows, logs] = await Promise.all([
    getThreadById(threadId),
    getThreadProcessRows(threadId),
    getRecentLogsForThread(threadId),
  ]);

  if (!thread) {
    throw new Error(`Thread not found: ${threadId}`);
  }

  const pids = processRows.map((row) => parseProcessUuid(row.processUuid).pid);
  const processTable = await getProcessTable(pids);
  const snapshots = listShellSnapshots().filter((snapshot) => snapshot.threadId === threadId);

  return {
    thread,
    rollout: parseRolloutFile(thread.rolloutPath),
    logs,
    processes: processRows.map((row) => processSummary(row, processTable)),
    shellSnapshots: snapshots,
  };
}

async function getProcessOverview() {
  const [processRows, threadProcessRows, threads] = await Promise.all([
    getProcessRows(),
    getThreadProcessRows(),
    getAllThreads(),
  ]);
  const pids = processRows.map((row) => parseProcessUuid(row.processUuid).pid);
  const processTable = await getProcessTable(pids);
  const threadById = new Map(threads.map((thread) => [thread.id, thread]));
  const threadRowsByProcess = new Map();

  for (const row of threadProcessRows) {
    if (!threadRowsByProcess.has(row.processUuid)) {
      threadRowsByProcess.set(row.processUuid, []);
    }
    const thread = threadById.get(row.threadId);
    threadRowsByProcess.get(row.processUuid).push({
      ...row,
      title: thread ? thread.title : row.threadId,
      cwd: thread ? thread.cwd : "",
      projectName: thread ? thread.projectName : "",
      lastAt: isoFromSeconds(row.lastTs),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    lookupAvailable: processTable.available,
    lookupError: processTable.error,
    processes: processRows.map((row) => ({
      ...processSummary(row, processTable),
      threads: threadRowsByProcess.get(row.processUuid) || [],
    })),
  };
}

module.exports = {
  collectOverview,
  getProjectDetail,
  getThreadDetail,
  getProcessOverview,
  getSourceInfo,
  parseProcessUuid,
  parsePsLine,
  parseRolloutFile,
  normalizeRolloutLine,
  buildProjects,
  shortText,
};
