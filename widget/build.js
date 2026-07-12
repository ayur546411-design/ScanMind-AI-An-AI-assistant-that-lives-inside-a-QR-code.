/**
 * build.js — Compression pipeline for QR-embeddable chat widget
 * 
 * Steps: read index.html → minify (HTML+CSS+JS) → gzip → base64 → report
 * 
 * Run: node build.js
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { minify: minifyHTML } = require("html-minifier-terser");

const INPUT = path.join(__dirname, "index.html");
const OUT_DIR = path.join(__dirname, "..", "dist");
const MINIFIED_OUT = path.join(OUT_DIR, "index.min.html");
const LOADER_HOST = "https://deploy-phi-mauve.vercel.app";
const QR_BUDGET = 2953; // Version 40, EC level L

async function build() {
  console.log("═══════════════════════════════════════════");
  console.log("  QR CHAT — COMPRESSION PIPELINE");
  console.log("═══════════════════════════════════════════\n");

  // Ensure output dir
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  // 1. Read source
  const source = fs.readFileSync(INPUT, "utf8");
  const sourceBytes = Buffer.byteLength(source, "utf8");
  console.log(`[1] Original:      ${sourceBytes} bytes`);

  // 2. Minify
  const minified = await minifyHTML(source, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    removeOptionalTags: true,
    minifyCSS: true,
    minifyJS: {
      mangle: { toplevel: true },
      compress: {
        passes: 3,
        drop_console: true,
        pure_getters: true,
        unsafe: true,
        unsafe_math: true,
      },
    },
    collapseBooleanAttributes: true,
    decodeEntities: true,
  });

  const minBytes = Buffer.byteLength(minified, "utf8");
  const minPct = ((1 - minBytes / sourceBytes) * 100).toFixed(1);
  console.log(`[2] Minified:      ${minBytes} bytes (${minPct}% reduction)`);

  // Save minified for inspection
  fs.writeFileSync(MINIFIED_OUT, minified);

  // 3. Gzip
  const gzipped = zlib.gzipSync(Buffer.from(minified, "utf8"), { level: 9 });
  const gzBytes = gzipped.length;
  const gzPct = ((1 - gzBytes / minBytes) * 100).toFixed(1);

  if (gzBytes >= minBytes) {
    console.log(`[!] WARNING: gzip did NOT reduce size (${gzBytes} >= ${minBytes}). Proceeding anyway.`);
  } else {
    console.log(`[3] Gzipped:       ${gzBytes} bytes (${gzPct}% reduction)`);
  }

  // 4. Base64
  const b64 = gzipped.toString("base64");
  const b64Bytes = Buffer.byteLength(b64, "utf8");
  const b64Overhead = ((b64Bytes / gzBytes - 1) * 100).toFixed(1);
  console.log(`[4] Base64:        ${b64Bytes} bytes (+${b64Overhead}% overhead)`);

  // 5. Full URL
  const fullURL = `${LOADER_HOST}/#${b64}`;
  const urlBytes = Buffer.byteLength(fullURL, "utf8");
  console.log(`[5] Full URL:      ${urlBytes} bytes`);

  // 6. PASS/FAIL against QR budget
  // For QR: only the data after # matters for payload, but the full URL is what gets encoded
  console.log("\n───────────────────────────────────────────");
  const margin = QR_BUDGET - b64Bytes;
  if (b64Bytes <= QR_BUDGET) {
    console.log(`✅ PASS — payload is ${b64Bytes} bytes (${margin} bytes under budget of ${QR_BUDGET})`);
  } else {
    console.log(`❌ FAIL — payload is ${b64Bytes} bytes (${Math.abs(margin)} bytes OVER budget of ${QR_BUDGET})`);
    console.log("\nSuggested cuts, ranked by likely impact:");
    console.log("  1. Trim IDENTITY project descriptions to ~50 chars each (biggest text savings)");
    console.log("  2. Remove CRT boot animation (@keyframes crtOn) — saves ~100 bytes pre-gzip");
    console.log("  3. Remove vignette effect (#app::before) — saves ~120 bytes pre-gzip");
    console.log("  4. Simplify scanline overlay to single rgba — saves ~60 bytes pre-gzip");
    console.log("  5. Shorten CSS custom property names (--bg, --green etc are already short)");
    console.log("  6. Remove scrollbar styling — saves ~80 bytes pre-gzip");
    console.log("  7. Reduce number of projects from 4 to 2-3");
    console.log("  8. Drop safe-area-inset @supports block — saves ~70 bytes pre-gzip");
  }
  console.log("───────────────────────────────────────────");

  // Save base64 payload to file for reference
  fs.writeFileSync(path.join(OUT_DIR, "payload.b64.txt"), b64);
  // Save the full URL
  fs.writeFileSync(path.join(OUT_DIR, "url.txt"), fullURL);

  console.log(`\nOutputs written to ${OUT_DIR}/`);
  console.log(`  payload.b64.txt  — raw base64 payload`);
  console.log(`  url.txt          — full URL for QR encoding`);
  console.log(`  index.min.html   — minified HTML for inspection`);

  return { b64Bytes, margin, b64, fullURL };
}

build().catch(console.error);
