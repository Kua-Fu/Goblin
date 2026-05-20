const test = require("node:test");
const assert = require("node:assert/strict");
const { createLauncherScript, shellQuote } = require("../scripts/install-native-host");

test("shellQuote safely quotes native host launcher paths", () => {
  assert.equal(shellQuote("/tmp/has space/node"), "'/tmp/has space/node'");
  assert.equal(shellQuote("/tmp/it'works/node"), "'/tmp/it'\\''works/node'");
});

test("createLauncherScript uses an absolute Node executable", () => {
  const script = createLauncherScript("/opt/homebrew/bin/node", "/Users/me/Goblin/native-host/host.js");

  assert.match(script, /^#!\/bin\/sh/);
  assert.match(script, /exec '\/opt\/homebrew\/bin\/node' '\/Users\/me\/Goblin\/native-host\/host\.js'/);
  assert.match(script, /Chrome Native Messaging/);
});
