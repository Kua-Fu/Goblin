#!/usr/bin/env node

const {
  collectOverview,
  getProjectDetail,
  getThreadDetail,
  getProcessOverview,
  getSourceInfo,
} = require("../src/codexData");

function parseLocalApiUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/api/")) {
    throw new Error("Only relative /api/* requests are allowed");
  }

  return new URL(value, "https://codex-local-viewer.invalid");
}

async function handleNativeRequest(message) {
  const url = parseLocalApiUrl(message?.url);

  if (url.pathname === "/api/overview") {
    return collectOverview();
  }

  if (url.pathname === "/api/project") {
    const cwd = url.searchParams.get("cwd");
    if (!cwd) {
      throw new Error("cwd is required");
    }
    return getProjectDetail(cwd);
  }

  if (url.pathname.startsWith("/api/thread/")) {
    const threadId = decodeURIComponent(url.pathname.slice("/api/thread/".length));
    if (!threadId) {
      throw new Error("thread id is required");
    }
    return getThreadDetail(threadId);
  }

  if (url.pathname === "/api/processes") {
    return getProcessOverview();
  }

  if (url.pathname === "/api/sources") {
    return getSourceInfo();
  }

  throw new Error(`Unsupported API route: ${url.pathname}`);
}

function writeNativeMessage(payload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8");
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length, 0);
  process.stdout.write(header);
  process.stdout.write(body);
}

function readNativeMessages(onMessage) {
  let buffer = Buffer.alloc(0);

  process.stdin.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const length = buffer.readUInt32LE(0);
      if (buffer.length < length + 4) {
        return;
      }

      const body = buffer.subarray(4, length + 4);
      buffer = buffer.subarray(length + 4);
      onMessage(JSON.parse(body.toString("utf8")));
    }
  });
}

function startNativeHost() {
  readNativeMessages(async (message) => {
    try {
      // Native Host 是唯一能读取 ~/.codex 的组件，因此这里必须坚持固定路由白名单，
      // 防止扩展层或未来 UI 误把任意路径、任意 SQL、任意命令传进来执行。
      const data = await handleNativeRequest(message);
      writeNativeMessage({ ok: true, data });
    } catch (error) {
      writeNativeMessage({ ok: false, error: error.message || String(error) });
    }
  });
}

if (require.main === module) {
  startNativeHost();
}

module.exports = {
  handleNativeRequest,
  parseLocalApiUrl,
  readNativeMessages,
  writeNativeMessage,
};
