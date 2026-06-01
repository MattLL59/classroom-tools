import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const lesson = eval("(" + readFileSync(join(root, "lessona.html"), "utf8").match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
lesson.component = 2;
lesson.settings = lesson.settings || { activeLevels: [1, 2, 3] };
lesson.settings.activeLevels = [1, 2, 3];
[1, 2, 3].forEach((n) => {
  lesson.settings.levelBank[n] = Object.assign({}, lesson.settings.levelBank[n] || {}, { shortAnswersOnly: true });
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 3; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, { prompt: `Part ${i + 1}. [1]` });
}
lesson.questions = qs;

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8782, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8782/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.component = 2;
  userState.level = 1;
  ui.sendSelectionQuotesDirectToAnswer({ onlyQuotes: ["First answer quote here"] });
  const afterL1 = userState.questionEssays["1_0"] || "";

  userState.level = 2;
  if(app.persistCurrentQuestionEssay) app.persistCurrentQuestionEssay();
  ui.sendSelectionQuotesDirectToAnswer({ onlyQuotes: ["Second answer quote here"] });
  app.repairWritingDeskStorage();

  const essay = document.getElementById("essay-area")?.value || userState.essay || "";
  return {
    afterL1HasFirst: afterL1.includes("First"),
    key1: userState.questionEssays["1_0"] || "",
    key2: userState.questionEssays["2_0"] || "",
    essay,
    hasFirst: essay.includes("First"),
    hasSecond: essay.includes("Second")
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
process.exit(result.key1.includes("First") && result.key2.includes("Second") && result.hasFirst && result.hasSecond ? 0 : 1);
