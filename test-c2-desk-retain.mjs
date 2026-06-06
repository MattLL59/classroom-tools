import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const html = readFileSync(join(root, "lessona.html"), "utf8");
const lesson = eval("(" + html.match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
if (!lesson.settings) lesson.settings = {};
if (!lesson.settings.levelBank) lesson.settings.levelBank = {};
lesson.settings.levelBank[1] = Object.assign({}, lesson.settings.levelBank[1] || {}, {
  shortAnswersOnly: true,
  freeSelectFromText: true,
  questionIds: ["q01", "q02"]
});
if (!Array.isArray(lesson.questions)) lesson.questions = [];
lesson.questions[0] = Object.assign({}, lesson.questions[0] || { id: "q01" }, { prompt: "(a) Detail one. [1]" });
lesson.questions[1] = Object.assign({}, lesson.questions[1] || { id: "q02" }, { prompt: "(b) Detail two. [1]" });
if (lesson.question) lesson.question = lesson.questions[0].prompt;

const server = createServer((req, res) => {
  const f = req.url.split("?")[0].replace(/^\//, "") || "architect_v131.html";
  try { res.writeHead(200); res.end(readFileSync(join(root, f))); } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8775, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], protocolTimeout: 120000 });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8775/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"), { timeout: 60000 });

const result = await page.evaluate(() => {
  appData.component = 2;
  appData.settings.levelBank[1] = Object.assign({}, appData.settings.levelBank[1] || {}, {
    shortAnswersOnly: true,
    questionIds: ["q01", "q02"]
  });
  userState.level = 1;
  userState.currentQuestionIndexByLevel = { 1: 0 };
  if (!userState.questionEssays) userState.questionEssays = {};

  ui.sendSelectionQuotesDirectToAnswer({
    openDeskAfterSave: true,
    onlyQuotes: ["First quote from passage"]
  });
  const afterQ1 = {
    qIdx: userState.currentQuestionIndexByLevel[1],
    essay: document.getElementById("essay-area")?.value || "",
    key0: userState.questionEssays["1_0"] || ""
  };

  ui.sendSelectionQuotesDirectToAnswer({
    openDeskAfterSave: true,
    onlyQuotes: ["Second quote from passage"]
  });
  const afterQ2 = {
    qIdx: userState.currentQuestionIndexByLevel[1],
    essay: document.getElementById("essay-area")?.value || "",
    key0: userState.questionEssays["1_0"] || "",
    key1: userState.questionEssays["1_1"] || ""
  };

  return { afterQ1, afterQ2 };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();

const ok = result.afterQ1.essay.includes("First")
  && result.afterQ2.essay.includes("First")
  && result.afterQ2.essay.includes("Second")
  && result.afterQ2.key1.includes("Second");
process.exit(ok ? 0 : 1);
