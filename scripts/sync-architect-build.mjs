#!/usr/bin/env node
/**
 * Single source of truth: architect-version.json → HTML meta tags + derived URLs.
 * Run after editing version.json, or via bump-architect-build.mjs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const versionPath = path.join(root, "architect-version.json");
const htmlPath = path.join(root, "architect_v131.html");

const version = JSON.parse(fs.readFileSync(versionPath, "utf8"));
if(!version.build || !version.gitCommit) {
    console.error("architect-version.json requires build and gitCommit");
    process.exit(1);
}

const cacheBust = String(version.build).replace(/\D/g, "").slice(0, 14);
const base = "https://mattll59.github.io/classroom-tools/architect_v131.html";
version.cacheBust = cacheBust;
version.pagesUrl = `${base}?b=${cacheBust}`;
version.recoveryUrl = `${base}?recovery=1&b=${cacheBust}`;
if(!version.app) version.app = "architect_v131.html";
if(!version.lobbyUrl) version.lobbyUrl = "https://mattll59.github.io/classroom-tools/index.html";

let html = fs.readFileSync(htmlPath, "utf8");
html = html.replace(/<meta name="architect-build" content="[^"]*">/, `<meta name="architect-build" content="${version.build}">`);
html = html.replace(/<meta name="architect-deploy" content="[^"]*">/, `<meta name="architect-deploy" content="${version.gitCommit}">`);
if(version.rev) {
    html = html.replace(/<meta name="architect-rev" content="[^"]*">/, `<meta name="architect-rev" content="${version.rev}">`);
}

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2) + "\n");
fs.writeFileSync(htmlPath, html);
console.log(`Synced ${version.build} · ${version.gitCommit} → architect_v131.html meta tags`);
