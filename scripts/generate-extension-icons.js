const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const sourceImage = path.join(repoRoot, "public", "assets", "goblin-logo.png");
const outDir = path.join(repoRoot, "extension", "icons");
const sizes = [16, 32, 48, 128];

function commandExists(command) {
  try {
    execFileSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function iconPath(size) {
  return path.join(outDir, `icon-${size}.png`);
}

function existingIconsAvailable() {
  return sizes.every((size) => fs.existsSync(iconPath(size)));
}

function runImageMagick(command) {
  for (const size of sizes) {
    execFileSync(command, [
      sourceImage,
      "-auto-orient",
      "-resize",
      `${size}x${size}^`,
      "-gravity",
      "center",
      "-extent",
      `${size}x${size}`,
      iconPath(size),
    ]);
  }
}

function runSips() {
  for (const size of sizes) {
    const tmpPath = path.join(outDir, `.icon-${size}-tmp.png`);
    execFileSync("sips", ["--resampleHeightWidthMax", String(Math.max(256, size * 4)), sourceImage, "--out", tmpPath], {
      stdio: "ignore",
    });
    execFileSync("sips", ["--cropToHeightWidth", String(size), String(size), tmpPath, "--out", iconPath(size)], {
      stdio: "ignore",
    });
    fs.rmSync(tmpPath, { force: true });
  }
}

function generateIcons() {
  if (!fs.existsSync(sourceImage)) {
    throw new Error(`Logo source image not found: ${sourceImage}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  if (commandExists("magick")) {
    runImageMagick("magick");
  } else if (commandExists("convert")) {
    runImageMagick("convert");
  } else if (commandExists("sips")) {
    runSips();
  } else if (existingIconsAvailable()) {
    console.warn("No image conversion tool found; keeping existing extension icons.");
  } else {
    throw new Error("Need ImageMagick, convert, or sips to generate extension icons.");
  }

  console.log(`Generated extension icons in ${outDir}`);
}

if (require.main === module) {
  generateIcons();
}

module.exports = {
  generateIcons,
};
