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
lesson.settings.teacherRecordStudentFlow = false;
[1, 2, 3].forEach((n) => {
  lesson.settings.levelBank[n] = Object.assign({}, lesson.settings.levelBank[n] || {}, {
    shortAnswersOnly: true,
    questionIds: ["q0" + n]
  });
});
const qs = Array.isArray(lesson.questions) ? lesson.questions : [];
for (let i = 0; i < 3; i++) {
  qs[i] = Object.assign({}, qs[i] || { id: "q0" + (i + 1) }, { prompt: `Q${i + 1} prompt [1]`, marks: 1 });
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
await new Promise((r) => server.listen(8790, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], protocolTimeout: 120000 });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8790/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  appData.isStandalone = false;
  appData.component = 2;
  appData.settings.teacherRecordStudentFlow = false;
  [1, 2, 3].forEach((n) => {
    appData.settings.levelBank[n] = Object.assign({}, appData.settings.levelBank[n] || {}, {
      shortAnswersOnly: true,
      questionIds: ["q0" + n]
    });
  });
  userState.level = 1;
  userState.view = "desk";
  if (!userState.questionEssays) userState.questionEssays = {};
  userState.questionEssays["1_0"] = "Question 1\n\n\"Teacher desk quote\"";
  if (app.bumpDeskCommitForLevel) app.bumpDeskCommitForLevel(1);
  if (app.buildWritingDeskDisplayEssay) userState.essay = app.buildWritingDeskDisplayEssay(1);
  const teacherPreview = app.isTeacherPreviewApp && app.isTeacherPreviewApp();
  const ready = app.isLevelProgressionReady && app.isLevelProgressionReady(1);
  ui.switchView("select", true);
  return {
    teacherPreview,
    ready,
    level: userState.level,
    view: userState.view
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();

const ok = result.teacherPreview && result.ready && result.level === 2 && result.view === "select";
process.exit(ok ? 0 : 1);
