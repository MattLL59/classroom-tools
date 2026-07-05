#!/usr/bin/env node
/**
 * Bump deploy stamp in architect-version.json and sync into architect_v131.html.
 * Usage: node scripts/bump-architect-build.mjs <deploy-slug> [YYYY-MM-DDTHH:00:00]
 *
 * Do not hand-edit HTML meta architect-build / architect-deploy — edit slug here only.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const slug = process.argv[2];
if(!slug || slug.startsWith("-")) {
    console.error("Usage: node scripts/bump-architect-build.mjs <deploy-slug> [build-stamp]");
    process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionPath = path.join(root, "architect-version.json");
const version = JSON.parse(fs.readFileSync(versionPath, "utf8"));

let build = process.argv[3];
if(!build) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    build = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00:00`;
}

version.build = build;
version.gitCommit = slug;

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2) + "\n");

const sync = path.join(root, "scripts", "sync-architect-build.mjs");
const r = spawnSync(process.execPath, [sync], { stdio: "inherit" });
if(r.status !== 0) process.exit(r.status ?? 1);

const verify = path.join(root, "scripts", "verify-architect-build-sync.mjs");
if(fs.existsSync(verify)) {
    const rv = spawnSync(process.execPath, [verify], { stdio: "inherit" });
    if(rv.status !== 0) process.exit(rv.status ?? 1);
}
process.exit(0);
