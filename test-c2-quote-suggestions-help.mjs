import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.sourceText = lesson.sourceText || "Line one about Harry West selling on the street.\nLine two about the crowd and movement.\nLine three about smartphone accessories.";
lesson.settings = lesson.settings || {};
lesson.settings.activeLevels = [1, 2];
lesson.settings.levelBank = lesson.settings.levelBank || {};
[1, 2].forEach((n) => {
  lesson.settings.levelBank[n] = Object.assign({}, lesson.settings.levelBank[n] || {}, {
    shortAnswersOnly: true,
    freeSelectFromText: true,
    questionIds: ["q0" + n]
  });
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 2; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, { prompt: `Part ${i + 1}. [1]` });
}
lesson.questions = qs;
lesson.items = [
  { id: "a", original: "Harry West selling on the street", quote: "Harry West selling on the street", correct: true, levels: [1], questionIds: ["q01"] },
  { id: "b", original: "crowd and movement", quote: "crowd and movement", correct: true, levels: [1], questionIds: ["q01"] },
  { id: "c", original: "smartphone accessories", quote: "smartphone accessories", correct: true, levels: [1], questionIds: ["q01"] }
];

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8784, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8784/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.component = 2;
  appData.items = [
    { id: "a", original: "Harry West selling on the street", quote: "Harry West selling on the street", correct: true, levels: [1], questionIds: ["q01"] },
    { id: "b", original: "crowd and movement", quote: "crowd and movement", correct: true, levels: [1], questionIds: ["q01"] },
    { id: "c", original: "smartphone accessories", quote: "smartphone accessories", correct: true, levels: [1], questionIds: ["q01"] }
  ];
  if(appData.selection) appData.selection.items = appData.items;
  userState.level = 1;
  userState.studentQuoteListHelp = true;
  userState.view = "select";
  ui.renderSelection();
  const area = document.getElementById("selection-area");
  const html = area ? area.innerHTML : "";
  const hasGrid = !!document.querySelector("#selection-quotes");
  const hasTapOnly = html.includes("Tap and drag in the source text above");
  const count = app.countQuoteChoicesForSelectionLevel(1);
  return { count, hasGrid, hasTapOnly, snippet: html.slice(0, 280) };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
process.exit(result.count >= 2 && result.hasGrid && !result.hasTapOnly ? 0 : 1);
