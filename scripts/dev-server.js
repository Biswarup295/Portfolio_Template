#!/usr/bin/env node
/*
 * Zero-dependency static dev server for the portfolio.
 *
 *   npm run dev          -> http://127.0.0.1:5173
 *   npm run dev:open     -> same, and opens your browser
 *   node scripts/dev-server.js --port 8080
 *
 * No packages are installed: this uses only Node's built-in http, fs and path modules.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argValue(flag) {
  const i = args.indexOf(flag);
  if (i === -1) return null;
  return args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
}

const PORT = Number(process.env.PORT || argValue("--port") || 5173);
const HOST = process.env.HOST || argValue("--host") || "127.0.0.1";
const SHOULD_OPEN = args.includes("--open") || argValue("--open") === "true";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".map": "application/json; charset=utf-8"
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  }, headers || {}));
  res.end(body);
}

const server = http.createServer((req, res) => {
  const started = process.hrtime.bigint();
  const url = new URL(req.url, "http://" + HOST + ":" + PORT);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.endsWith("/")) pathname += "index.html";

  // Keep requests inside the project folder.
  const filePath = path.resolve(ROOT, "." + pathname);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    send(res, 403, "403 Forbidden");
    return log(req, 403, started);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const notFound = "404 Not Found: " + pathname;
      send(res, 404, notFound);
      return log(req, 404, started);
    }

    const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stats.size,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });

    if (req.method === "HEAD") {
      res.end();
      return log(req, 200, started);
    }

    const stream = fs.createReadStream(filePath);
    stream.on("error", () => res.destroy());
    stream.pipe(res);
    res.on("finish", () => log(req, 200, started));
  });
});

function log(req, status, started) {
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  console.log(
    "  " + status + "  " + req.method + " " + req.url + "  " + ms.toFixed(1) + "ms"
  );
}

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("\n  Port " + PORT + " is already in use.");
    console.error("  Try: npm run dev -- --port " + (PORT + 1) + "\n");
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  const url = "http://" + HOST + ":" + PORT + "/";
  console.log("\n  Portfolio dev server running");
  console.log("  " + url + "\n");
  console.log("  Serving " + ROOT);
  console.log("  Press Ctrl+C to stop\n");

  if (SHOULD_OPEN) {
    const opener = process.platform === "win32" ? "explorer"
      : process.platform === "darwin" ? "open" : "xdg-open";
    execFile(opener, [url], () => {});
  }
});

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => {
    console.log("\n  Stopped.\n");
    server.close(() => process.exit(0));
  });
});
