import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const passage = "Line one when there were stalls every Saturday here.\nLine two crowd noise.";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.sourceText = passage;
lesson.settings = {
  activeLevels: [1],
  levelBank: { 1: { shortAnswersOnly: true, questionIds: ["q01"] } },
  selectionStages: ["discriminate", "justify"]
};
lesson.selection = lesson.selection || {};
lesson.selection.enabled = true;
lesson.selection.modes = Object.assign({}, lesson.selection.modes || {}, {
  requireReason: true,
  stages: ["discriminate", "justify"]
});
lesson.questions = [{ id: "q01", prompt: "(a) Give one detail. [1]", marks: 1 }];
lesson.items = [
  { original: "when there were stalls every Saturday", quote: "when there were stalls every Saturday", correct: true, levels: [1], questionIds: ["q01"], reasons: ["It shows change over time"] },
  { original: "crowd noise every week", quote: "crowd noise every week", correct: true, levels: [1], questionIds: ["q01"], reasons: ["It shows atmosphere"] },
  { original: "Line two only", quote: "Line two only", correct: false, levels: [1], questionIds: ["q01"] }
];
lesson.selection.items = lesson.items;

const server = createServer((req, res) => {
  try {
    res.writeHead(200);
    res.end(readFileSync(join(root, "architect_v131.html")));
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(8791, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8791/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const items = lesson.items;
const result = await page.evaluate((itemsIn) => {
  appData.isStandalone = false;
  appData.component = 2;
  appData.items = itemsIn.slice();
  appData.sourceText = "Line one when there were stalls every Saturday here.\nLine two crowd noise.";
  if(appData.selection) appData.selection.text = { source: appData.sourceText };
  appData.settings.selectionStages = ["discriminate", "justify"];
  appData.settings.modules = Object.assign({ selection: true, desk: true, lab: true }, appData.settings.modules || {});
  if(appData.selection) {
    appData.selection.enabled = true;
    appData.selection.items = itemsIn.slice();
    appData.selection.modes = appData.selection.modes || {};
    appData.selection.modes.requireReason = true;
    appData.selection.modes.stages = ["discriminate", "justify"];
    appData.selection.stageConfigByLevel = { 1: { justify: "free" } };
  }
  userState.level = 1;
  userState.studentQuoteListHelp = true;
  userState.selectionStage = 1;
  const diag = {
    quoteCount: app.countQuoteChoicesForSelectionLevel(1),
    help: userState.studentQuoteListHelp,
    justify: app.selectionUsesJustifyStage(1),
    short: app.isShortAnswerLevel(1)
  };
  ui.renderSelection();
  diag.grid = document.querySelectorAll("#selection-quotes .card-select-quote").length;
  const cards = Array.from(document.querySelectorAll("#selection-quotes .card-select-quote"));
  const satCard = cards.find((c) => (c.textContent || "").includes("Saturday"));
  if(satCard) {
    const strongBtn = satCard.querySelectorAll("button.btn")[0];
    if(strongBtn) strongBtn.click();
  }
  const afterStrong = document.getElementById("selection-area")?.textContent || "";
  const hasPrompt = /How does this quote help|Justify|Examine your quote/i.test(afterStrong);
  let deskView = userState.view;
  const justifyBox = document.getElementById("selection-free-justify") || document.getElementById("free-select-why");
  if(justifyBox) {
    justifyBox.value = "It shows the market used to be busy on Saturdays.";
    justifyBox.dispatchEvent(new Event("input", { bubbles: true }));
    const nextBtn = document.getElementById("selection-free-justify-next");
    if(nextBtn) nextBtn.click();
  } else {
    for (const b of document.querySelectorAll("#selection-area button[data-reason]")) {
      b.click();
      if (userState.view === "desk") break;
    }
  }
  deskView = userState.view;
  const essayLen = (document.getElementById("essay-area")?.value || "").length;
  return {
    diag,
    hasPrompt,
    afterStrong: afterStrong.slice(0, 200),
    view: deskView,
    essayLen,
    hasJustifyBox: !!justifyBox
  };
}, items);

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = result.diag.grid >= 1 && result.hasPrompt && result.view === "desk";
process.exit(ok ? 0 : 1);
