import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const passage = "Line one when there were stalls every Saturday here.\nLine two crowd noise.\nLine three end.";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.sourceText = passage;
lesson.settings = { activeLevels: [1], levelBank: { 1: { shortAnswersOnly: true, questionIds: ["q01"] } } };
lesson.questions = [{ id: "q01", prompt: "Read lines 1–1. Give one detail. [1]", lineRef: "1-1" }];

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8787, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8787/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate((passageText) => {
  appData.sourceText = passageText;
  if(appData.selection) {
    if(!appData.selection.text) appData.selection.text = {};
    appData.selection.text.source = passageText;
  }
  appData.items = [
    { original: "when there were stalls every Saturday", quote: "when there were stalls every Saturday", correct: true, levels: [1], questionIds: ["q01"] },
    { original: "crowd noise", quote: "crowd noise", correct: true, levels: [1], questionIds: ["q01"] }
  ];
  if(appData.selection) appData.selection.items = appData.items;
  userState.level = 1;
  const stats = app.getQuoteChoiceEligibilityForLevel(1);
  userState.studentQuoteListHelp = true;
  userState.studentHelpPanelOpen = true;
  ui.renderSelection();
  const hint = document.getElementById("selection-student-help-options")?.textContent || "";
  return { stats, hint: hint.slice(0, 200), canList: stats.usable >= 2 };
}, passage);

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
process.exit(result.stats.assigned === 2 && result.stats.usable >= 1 && result.canList ? 0 : 1);
