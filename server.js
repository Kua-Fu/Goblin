const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  collectOverview,
  getProjectDetail,
  getThreadDetail,
  getProcessOverview,
  getSourceInfo,
} = require("./src/codexData");

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3001);
const publicDir = path.join(__dirname, "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendError(res, status, error) {
  sendJson(res, status, { error: error.message || String(error) });
}

function sendFile(req, res, urlPath) {
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(publicDir, requested));
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "content-type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(buffer);
  });
}

async function routeApi(req, res, url) {
  if (url.pathname === "/api/overview") {
    sendJson(res, 200, await collectOverview());
    return;
  }

  if (url.pathname === "/api/project") {
    const cwd = url.searchParams.get("cwd");
    if (!cwd) {
      sendError(res, 400, new Error("cwd is required"));
      return;
    }
    sendJson(res, 200, await getProjectDetail(cwd));
    return;
  }

  if (url.pathname.startsWith("/api/thread/")) {
    const threadId = decodeURIComponent(url.pathname.slice("/api/thread/".length));
    sendJson(res, 200, await getThreadDetail(threadId));
    return;
  }

  if (url.pathname === "/api/processes") {
    sendJson(res, 200, await getProcessOverview());
    return;
  }

  if (url.pathname === "/api/sources") {
    sendJson(res, 200, getSourceInfo());
    return;
  }

  sendError(res, 404, new Error("Unknown API route"));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await routeApi(req, res, url);
      return;
    }

    sendFile(req, res, url.pathname);
  } catch (error) {
    sendError(res, 500, error);
  }
});

server.listen(port, host, () => {
  console.log(`goblin running at http://${host}:${port}`);
});
