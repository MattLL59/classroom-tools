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
  const qid = "q0" + n;
  lesson.settings.levelBank[n] = Object.assign({}, lesson.settings.levelBank[n] || {}, {
    shortAnswersOnly: true,
    freeSelectFromText: true,
    questionIds: [qid]
  });
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 3; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, {
    prompt: `Question part ${i + 1} prompt. [1]`,
    marks: 1
  });
}
lesson.questions = qs;

const server = createServer((req, res) => {
  const f = req.url.split("?")[0].replace(/^\//, "") || "architect_v131.html";
  try {
    res.writeHead(200);
    res.end(readFileSync(join(root, f)));
  } catch {
    if (!res.headersSent) res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(8789, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], protocolTimeout: 120000 });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8789/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.component = 2;
  [1, 2, 3].forEach((n) => {
    appData.settings.levelBank[n] = Object.assign({}, appData.settings.levelBank[n] || {}, {
      shortAnswersOnly: true,
      questionIds: ["q0" + n]
    });
  });
  userState.level = 1;
  userState.currentQuestionIndexByLevel = { 1: 0 };
  userState.view = "select";

  ui.sendSelectionQuotesDirectToAnswer({
    openDeskAfterSave: true,
    onlyQuotes: ["First quote for level one"]
  });
  const afterDeskSave = {
    level: userState.level,
    view: userState.view,
    quoteOnly: !!(app.isQuoteOnlyShortAnswerLevel && app.isQuoteOnlyShortAnswerLevel(1)),
    comp: app.getArchitectComponent(),
    short: app.levelBankShortAnswerEnabled(1),
    marks: app.getExamMarksFromQuestionForLevel(1)
  };

  userState.level = 1;
  userState.view = "desk";
  if(!userState.questionEssays) userState.questionEssays = {};
  userState.questionEssays["1_0"] = "Question 1\n\n\"Simulated quote\"";
  userState.selectionCompleted = true;
  userState.deskQueue = [];
  userState.selectionChosen = [];
  if(app.buildWritingDeskDisplayEssay) userState.essay = app.buildWritingDeskDisplayEssay(1);

  ui.switchView("select", true);
  const afterManual = {
    level: userState.level,
    view: userState.view,
    hasL1: !!(userState.questionEssays && userState.questionEssays["1_0"])
  };

  return { afterDeskSave, afterManual };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();

const ok =
  result.afterManual.level === 2 &&
  result.afterManual.view === "select" &&
  result.afterManual.hasL1 &&
  (result.afterDeskSave.quoteOnly !== true ||
    (result.afterDeskSave.level === 1 &&
      result.afterDeskSave.view === "desk"));

if (!ok) {
  console.error("advance-on-return-select: FAIL");
  process.exit(1);
}
console.log("advance-on-return-select: OK");
process.exit(0);
