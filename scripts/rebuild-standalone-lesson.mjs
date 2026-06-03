#!/usr/bin/env node
/**
 * Re-embed STANDALONE_LESSON from an exported student HTML into the current architect_v131 shell.
 * Run after merging app fixes so lessona.html / lessonb.html stay in sync with GitHub Pages.
 *
 * Usage: node scripts/rebuild-standalone-lesson.mjs lessona.html [lessonb.html ...]
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const archPath = join(root, "architect_v131.html");
const arch = readFileSync(archPath, "utf8");
const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("Usage: node scripts/rebuild-standalone-lesson.mjs <standalone.html> [...]");
  process.exit(1);
}

for (const rel of targets) {
  const path = join(root, rel);
  const old = readFileSync(path, "utf8");
  const marker = "window.STANDALONE_LESSON";
  const idx = old.indexOf(marker);
  if (idx < 0) {
    console.error("Skip (no STANDALONE_LESSON):", rel);
    continue;
  }
  const scriptOpen = old.lastIndexOf("<script", idx);
  const scriptClose = old.indexOf("</script>", idx);
  if (scriptOpen < 0 || scriptClose < 0) {
    console.error("Could not find lesson script bounds:", rel);
    process.exit(1);
  }
  const lessonScript = old.slice(scriptOpen, scriptClose + "</script>".length);
  const bodyMatch = arch.match(/<body([^>]*)>/i);
  if (!bodyMatch) {
    console.error("architect_v131.html has no <body>");
    process.exit(1);
  }
  const out = arch.replace(/<body([^>]*)>/i, `<body$1>\n${lessonScript}\n`);
  writeFileSync(path, out);
  const build = (out.match(/architect-build" content="([^"]+)"/) || [])[1] || "?";
  console.log("Rebuilt", rel, "· shell build", build);
}
