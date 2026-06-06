import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
const passage = "Line one when there were stalls every Saturday here.\nLine two crowd noise.";
lesson.sourceText = passage;
lesson.settings = lesson.settings || {};
lesson.settings.selectionStages = ["discriminate", "align", "justify"];
lesson.settings.levelBank = { 1: { shortAnswersOnly: true, questionIds: ["q01"] } };
lesson.settings.activeLevels = [1];
lesson.settings.modules = { selection: true, desk: true, lab: true };
const items = [
  { original: "when there were stalls every Saturday", quote: "when there were stalls every Saturday", correct: true, levels: [1], questionIds: ["q01"], reasons: ["It shows change"] },
  { original: "crowd noise every week", quote: "crowd noise every week", correct: true, levels: [1], questionIds: ["q01"], reasons: ["It shows atmosphere"] },
  { original: "wrong line", quote: "wrong line", correct: false, levels: [1], questionIds: ["q01"] }
];

const server = createServer((req, res) => {
  try {
    res.writeHead(200);
    res.end(readFileSync(join(root, "architect_v131.html")));
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(8792, r));

lesson.items = items;
lesson.selection = lesson.selection || {};
lesson.selection.items = items;
lesson.selection.modes = { requireReason: true, stages: ["discriminate", "align", "justify"] };
lesson.selection.stageConfigByLevel = { 1: { justify: "free" } };

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8792/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate((passageText, itemsIn) => {
  appData.isStandalone = false;
  appData.component = 2;
  appData.sourceText = passageText;
  appData.items = itemsIn.slice();
  appData.settings = appData.settings || {};
  appData.settings.modules = { selection: true, desk: true, lab: true };
  appData.settings.selectionStages = ["discriminate", "align", "justify"];
  appData.settings.levelBank = { 1: { shortAnswersOnly: true, questionIds: ["q01"] } };
  appData.settings.activeLevels = [1];
  appData.selection = appData.selection || {};
  appData.selection.enabled = true;
  appData.selection.items = itemsIn.slice();
  appData.selection.text = { source: passageText };
  appData.selection.modes = { requireReason: true, stages: ["discriminate", "align", "justify"] };
  appData.selection.stageConfigByLevel = { 1: { justify: "free" } };
  userState.level = 1;
  userState.studentQuoteListHelp = true;
  userState.selectionStage = 1;

  const effStages = app.getEffectiveSelectionStagesForLevel(1);
  ui.renderSelection();
  const afterRender = document.getElementById("selection-area")?.textContent || "";
  const cards = Array.from(document.querySelectorAll("#selection-quotes .card-select-quote"));
  const satCard = cards.find((c) => (c.textContent || "").includes("Saturday"));
  if (satCard) satCard.querySelectorAll("button.btn")[0]?.click();
  const afterStrong = document.getElementById("selection-area")?.textContent || "";
  const looping = /Choose the best quote/i.test(afterStrong) && !/How does this quote help|Justify/i.test(afterStrong);
  const justifyBox = document.getElementById("selection-free-justify");
  if (justifyBox) {
    justifyBox.value = "Shows the market was once busy.";
    document.getElementById("selection-free-justify-next")?.click();
  }
  return {
    effStages,
    stageAfterGo: userState.selectionStage,
    effStageKey: effStages[userState.selectionStage - 1],
    looping,
    hasJustify: /How does this quote help/i.test(afterStrong),
    view: userState.view,
    essayLen: (document.getElementById("essay-area")?.value || "").length
  };
}, passage, items);

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = !result.looping && result.hasJustify && result.effStages.includes("justify")
  && result.effStageKey === "justify" && result.view === "desk" && result.essayLen > 10;
process.exit(ok ? 0 : 1);
