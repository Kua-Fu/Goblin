const test = require("node:test");
const assert = require("node:assert/strict");
const { parseLocalApiUrl, handleNativeRequest } = require("../native-host/codex-local-viewer-host");

test("parseLocalApiUrl only accepts relative local API paths", () => {
  assert.equal(parseLocalApiUrl("/api/overview").pathname, "/api/overview");
  assert.throws(() => parseLocalApiUrl("https://example.com/api/overview"), /Only relative/);
  assert.throws(() => parseLocalApiUrl("/Users/me/.codex/auth.json"), /Only relative/);
});

test("handleNativeRequest rejects unsupported routes before touching data sources", async () => {
  await assert.rejects(
    () => handleNativeRequest({ url: "/api/read-file?path=/Users/me/.codex/auth.json" }),
    /Unsupported API route/,
  );
});
