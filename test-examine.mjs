import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const html = readFileSync(join(root, "lessona.html"), "utf8");
const lesson = eval("(" + html.match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;

const server = createServer((req, res) => {
  const f = req.url.split("?")[0].replace(/^\//, "") || "architect_v131.html";
  try { res.writeHead(200); res.end(readFileSync(join(root, f))); } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8770, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8770/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));
await page.evaluate(() => ui.switchView("select", true));

const result = await page.evaluate(async () => {
  userState.level = 1;
  appData.isStandalone = false;
  appData.items = [];
  userState.selectionAnsweredForQuestion = ["some quote text here"];
  const before = app.isLevelSelectionGoalMet(1);
  app.checkLevelCompletion();
  const levelAfterCheck = userState.level;
  const line = document.querySelector("#source-inline-select .source-line-text");
  const quote = line.firstChild.textContent.slice(0, 40).trim();
  ui._freeSelectPendingQuote = quote;
  ui.renderSelection(null, { skipPassage: true });
  document.getElementById("free-select-why").value = "My paraphrase text here";
  document.getElementById("free-select-use").click();
  await new Promise((r) => setTimeout(r, 300));
  const levelAfterSave = app.getEffectiveLevel();
  ui.switchView("desk", true);
  const essay = document.getElementById("essay-area")?.value || "";
  const teacherAdvanceBlocked = !app.advanceStudentToNextActiveLevel({ showCelebration: false });
  return {
    beforeGoalMet: before,
    levelAfterCheck,
    levelAfterSave,
    essayLen: essay.length,
    hasParaphrase: essay.toLowerCase().includes("paraphrase"),
    teacherAdvanceBlocked
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = !result.beforeGoalMet
  && result.levelAfterCheck === 1
  && result.levelAfterSave === 1
  && result.hasParaphrase
  && result.essayLen > 10
  && result.teacherAdvanceBlocked;
process.exit(ok ? 0 : 1);
