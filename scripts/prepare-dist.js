const fs = require("fs");
const path = require("path");

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        // ignore locked/missing file
      }
    }
  }
}

function prepareDist() {
  const rootDir = process.cwd();
  const nextDir = path.join(rootDir, ".next");
  const distDir = path.join(rootDir, "dist");
  const publicDir = path.join(rootDir, "public");

  console.log("[prepare-dist] Creating dist build artifacts directory...");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Copy public assets into dist
  if (fs.existsSync(publicDir)) {
    copyDirRecursive(publicDir, distDir);
    copyDirRecursive(publicDir, path.join(distDir, "public"));
  }

  // 2. Copy .next/static into dist/_next/static and dist/static
  const nextStatic = path.join(nextDir, "static");
  if (fs.existsSync(nextStatic)) {
    copyDirRecursive(nextStatic, path.join(distDir, "_next", "static"));
    copyDirRecursive(nextStatic, path.join(distDir, "static"));
  }

  // 3. Copy standalone build if present
  const standaloneDir = path.join(nextDir, "standalone");
  if (fs.existsSync(standaloneDir)) {
    copyDirRecursive(standaloneDir, distDir);
  }

  // 4. Copy .next entire build into dist/.next
  copyDirRecursive(nextDir, path.join(distDir, ".next"));

  // 5. Locate or generate root index.html for static artifact hosting
  const candidateHtmls = [
    path.join(nextDir, "server", "app", "(marketing)", "page.html"),
    path.join(nextDir, "server", "app", "index.html"),
    path.join(nextDir, "server", "pages", "index.html"),
    path.join(nextDir, "server", "app", "_not-found.html"),
  ];

  let htmlFound = false;
  for (const cand of candidateHtmls) {
    if (fs.existsSync(cand)) {
      fs.copyFileSync(cand, path.join(distDir, "index.html"));
      htmlFound = true;
      console.log(`[prepare-dist] Copied ${cand} -> dist/index.html`);
      break;
    }
  }

  if (!htmlFound) {
    // Generate a fallback entry HTML pointing to the application
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Salt Republic — Private Yacht Charter Maldives</title>
  <meta http-equiv="refresh" content="0; url=/">
</head>
<body style="background:#071b26;color:#f6f3ec;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div>
    <h2>Salt Republic</h2>
    <p>Loading application...</p>
    <script>window.location.href = window.location.pathname;</script>
  </div>
</body>
</html>`;
    fs.writeFileSync(path.join(distDir, "index.html"), fallbackHtml, "utf8");
    console.log("[prepare-dist] Generated root dist/index.html");
  }

  // 6. Ensure server.js / server.cjs exists in dist
  const rootServerJs = path.join(rootDir, "server.js");
  if (fs.existsSync(rootServerJs)) {
    fs.copyFileSync(rootServerJs, path.join(distDir, "server.js"));
    fs.copyFileSync(rootServerJs, path.join(distDir, "server.cjs"));
  }

  const rootPkg = path.join(rootDir, "package.json");
  if (fs.existsSync(rootPkg)) {
    fs.copyFileSync(rootPkg, path.join(distDir, "package.json"));
  }

  console.log("[prepare-dist] Dist artifacts successfully prepared in:", distDir);
  const distFiles = fs.readdirSync(distDir);
  console.log("[prepare-dist] Dist root contains:", distFiles.join(", "));
}

prepareDist();
