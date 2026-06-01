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
lesson.settings.activeLevels = [1, 2, 3, 4];
[1, 2, 3, 4].forEach((n) => {
  lesson.settings.levelBank[n] = { shortAnswersOnly: true, freeSelectFromText: true };
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 4; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, { prompt: `Part ${i + 1}. [1]` });
}
lesson.questions = qs;

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8779, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8779/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.component = 2;
  userState.level = 4;
  const quote = "there were so many people it was impossible to move";

  ui.sendSelectionQuotesDirectToAnswer({ onlyQuotes: [quote] });
  const afterFirst = userState.questionEssays["4_0"] || "";
  const countFirst = (afterFirst.match(/impossible to move/gi) || []).length;

  userState.deskQueue = [quote];
  userState.selectionChosen = [quote];
  ui.sendSelectionQuotesDirectToAnswer({ useDeskQueue: true, stayOnQuoteSelect: true });
  const afterResend = userState.questionEssays["4_0"] || "";
  const countResend = (afterResend.match(/impossible to move/gi) || []).length;

  const qNum = app.getQuestionNumberForEssay(4);
  const hasCorrectHeader = /^Question\s+4\s*\n/i.test(afterResend);

  return { countFirst, countResend, qNum, hasCorrectHeader, afterResend: afterResend.slice(0, 120) };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
process.exit(result.countFirst === 1 && result.countResend === 1 && result.qNum === 4 && result.hasCorrectHeader ? 0 : 1);
