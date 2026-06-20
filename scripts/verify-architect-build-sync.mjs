#!/usr/bin/env node
/**
 * Fail if architect-version.json and architect_v131.html meta tags disagree.
 * Run in CI on every PR — prevents the "Wrong copy loaded" mismatch banner.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionPath = path.join(root, "architect-version.json");
const htmlPath = path.join(root, "architect_v131.html");
const indexPath = path.join(root, "index.html");

const version = JSON.parse(fs.readFileSync(versionPath, "utf8"));
const html = fs.readFileSync(htmlPath, "utf8");
let failed = false;

function fail(msg) {
    console.error("verify-architect-build-sync:", msg);
    failed = true;
}

const buildMeta = html.match(/<meta name="architect-build" content="([^"]*)">/);
const deployMeta = html.match(/<meta name="architect-deploy" content="([^"]*)">/);

if(!buildMeta) fail("architect_v131.html missing architect-build meta tag");
else if(buildMeta[1] !== version.build) {
    fail(`build mismatch: version.json=${version.build} html meta=${buildMeta[1]} — run: node scripts/sync-architect-build.mjs`);
}

if(!deployMeta) fail("architect_v131.html missing architect-deploy meta tag");
else if(deployMeta[1] !== version.gitCommit) {
    fail(`deploy slug mismatch: version.json=${version.gitCommit} html meta=${deployMeta[1]} — run: node scripts/sync-architect-build.mjs`);
}

if(version.cacheBust) {
    const expectedB = String(version.cacheBust);
    if(buildMeta && buildMeta[1].replace(/\D/g, "").slice(0, 14) !== expectedB) {
        fail(`cacheBust ${expectedB} does not match build stamp ${buildMeta[1]}`);
    }
    if(fs.existsSync(indexPath)) {
        const indexHtml = fs.readFileSync(indexPath, "utf8");
        if(!indexHtml.includes(`architect_v131.html?b=${expectedB}`)) {
            fail(`index.html lobby link missing ?b=${expectedB} — run: node scripts/sync-architect-build.mjs`);
        }
    }
}

if(failed) {
    console.error("\nFix: node scripts/bump-architect-build.mjs <slug> [build-stamp]");
    console.error("  or after editing version.json: node scripts/sync-architect-build.mjs");
    process.exit(1);
}

console.log(`OK · ${version.build} · ${version.gitCommit}`);
