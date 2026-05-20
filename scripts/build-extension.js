const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "dist", "chrome-extension");

const copiedFiles = [
  ["extension/manifest.json", "manifest.json"],
  ["extension/background.js", "background.js"],
  ["extension/popup.html", "popup.html"],
  ["extension/popup.css", "popup.css"],
  ["extension/popup.js", "popup.js"],
  ["public/index.html", "index.html"],
  ["public/styles.css", "styles.css"],
  ["public/app.js", "app.js"],
];

function copyFile(from, to) {
  const source = path.join(repoRoot, from);
  const target = path.join(outDir, to);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDir(from, to) {
  const source = path.join(repoRoot, from);
  const target = path.join(outDir, to);
  fs.cpSync(source, target, { recursive: true });
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const [source, target] of copiedFiles) {
  copyFile(source, target);
}

copyDir("public/assets", "assets");
copyDir("public/vendor", "vendor");
copyDir("extension/icons", "icons");

console.log(`Chrome extension written to ${outDir}`);
