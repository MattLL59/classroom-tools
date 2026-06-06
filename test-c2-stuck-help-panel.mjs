import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.sourceText = "Line one.\nLine two.\nLine three.";
lesson.settings = { activeLevels: [1, 4], levelBank: { 1: { shortAnswersOnly: true, questionIds: ["q01"] }, 4: { shortAnswersOnly: true, questionIds: ["q04"] } } };
lesson.questions = [
  { id: "q01", prompt: "Q1 [1]" },
  { id: "q04", prompt: "Q4 [1]" }
];

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8786, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8786/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.items = [
    { original: "quote A", quote: "quote A", correct: true, levels: [1], questionIds: ["q01"], translation: "gloss A" },
    { original: "quote B", quote: "quote B", correct: true, levels: [1], questionIds: ["q01"], translation: "gloss B" }
  ];
  if(appData.selection) appData.selection.items = appData.items;
  userState.level = 4;
  userState.studentHelpPanelOpen = true;
  userState.studentHelpAiMeanings = true;
  ui.renderSelection();
  const details = document.getElementById("selection-student-help-details");
  const refs = document.getElementById("selection-student-help-refs");
  return {
    detailsOpen: details ? details.open : false,
    refsText: refs ? refs.textContent : "",
    onL4: app.countQuoteChoicesForSelectionLevel(4),
    onL1: app.countQuoteChoicesForSelectionLevel(1),
    other: app.countGoodQuotesOnOtherLevels(4)
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = result.detailsOpen && result.refsText.includes("No quotes linked to Level 4") && result.onL4 === 0 && result.onL1 === 2 && result.other === 2;
process.exit(ok ? 0 : 1);
