import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const html = readFileSync(join(root, "lessona.html"), "utf8");
const lesson = eval("(" + html.match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.settings = lesson.settings || {};
lesson.settings.levelBank = lesson.settings.levelBank || {};
lesson.settings.activeLevels = [1, 2, 3];
[1, 2, 3].forEach((n) => {
  lesson.settings.levelBank[n] = Object.assign({}, lesson.settings.levelBank[n] || {}, {
    shortAnswersOnly: true,
    freeSelectFromText: true
  });
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 3; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, { prompt: `Question part ${i + 1} prompt. [1]` });
}
lesson.questions = qs;

const server = createServer((req, res) => {
  const f = req.url.split("?")[0].replace(/^\//, "") || "architect_v131.html";
  try { res.writeHead(200); res.end(readFileSync(join(root, f))); } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8778, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], protocolTimeout: 120000 });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8778/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.component = 2;
  [1, 2, 3].forEach((n) => {
    appData.settings.levelBank[n] = Object.assign({}, appData.settings.levelBank[n] || {}, { shortAnswersOnly: true });
  });
  userState.level = 1;
  userState.currentQuestionIndexByLevel = { 1: 0 };

  ui.sendSelectionQuotesDirectToAnswer({ openDeskAfterSave: false, onlyQuotes: ["Quote for level one"] });
  const afterL1 = {
    level: userState.level,
    essay: userState.essay || "",
    key1: userState.questionEssays["1_0"] || ""
  };

  userState.level = 2;
  ui.sendSelectionQuotesDirectToAnswer({ openDeskAfterSave: false, onlyQuotes: ["Quote for level two"] });
  const afterL2 = {
    level: userState.level,
    essay: userState.essay || "",
    hasL1: (userState.essay || "").includes("level one"),
    hasL2: (userState.essay || "").includes("level two")
  };

  ui.switchView("desk", true);
  const deskText = document.getElementById("essay-area")?.value || "";

  return { afterL1, afterL2, deskText, accum: app.shouldAccumulateDeskAcrossLevels() };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = result.accum && result.afterL2.hasL1 && result.afterL2.hasL2
  && result.deskText.includes("level one") && result.deskText.includes("level two");
process.exit(ok ? 0 : 1);
