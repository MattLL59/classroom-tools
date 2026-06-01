import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.settings = lesson.settings || { activeLevels: [1, 2, 3, 4] };
lesson.settings.activeLevels = [1, 2, 3, 4];
lesson.settings.levelBank = lesson.settings.levelBank || {};
[1, 2, 3, 4].forEach((n) => {
  lesson.settings.levelBank[n] = Object.assign({}, lesson.settings.levelBank[n] || {}, { shortAnswersOnly: true });
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 4; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, { prompt: `Part ${i + 1}. [1]` });
}
lesson.questions = qs;

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8783, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8783/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.component = 2;
  const quotes = ["Quote for Q1", "Quote for Q2", "Quote for Q3", "Quote for Q4"];
  const labels = [];

  [1, 2, 3, 4].forEach((lvl, i) => {
    userState.level = lvl;
    ui.sendSelectionQuotesDirectToAnswer({ onlyQuotes: [quotes[i]] });
    app.repairWritingDeskStorage();
    labels.push({
      level: lvl,
      qNum: app.getQuestionNumberForEssay(lvl),
      stored: (userState.questionEssays[String(lvl) + "_0"] || "").match(/^Question\s+\d+/i)?.[0] || ""
    });
  });

  const essay = document.getElementById("essay-area")?.value || userState.essay || "";
  const headers = [...essay.matchAll(/^Question\s+(\d+)/gim)].map((m) => parseInt(m[1], 10));

  return { labels, headers, essay: essay.slice(0, 400) };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();

const ok = result.labels.every((l, i) => l.qNum === i + 1 && l.stored === "Question " + (i + 1))
  && result.headers.length === 4
  && result.headers.every((n, i) => n === i + 1);
process.exit(ok ? 0 : 1);
