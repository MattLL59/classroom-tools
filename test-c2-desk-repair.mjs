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
const dup = "Question 1\n\n\"there were so many people it was impossible to move.\"";
lesson.userState = {
  level: 4,
  view: "desk",
  questionEssays: { "1_0": dup, "2_0": dup, "3_0": dup, "4_0": dup + "\n\n" + dup },
  deskQueue: ["there were so many people it was impossible to move."],
  selectionChosen: ["there were so many people it was impossible to move."]
};

const server = createServer((req, res) => {
  try { res.writeHead(200); res.end(readFileSync(join(root, "architect_v131.html"))); } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8780, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8780/architect_v131.html?recovery=1");
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload();
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));

const result = await page.evaluate(() => {
  app.repairWritingDeskStorage();
  ui.switchView("desk", true);
  const essay = document.getElementById("essay-area")?.value || "";
  const matches = essay.match(/impossible to move/gi) || [];
  const q1headers = essay.match(/^Question\s+1\s*$/gim) || [];
  return {
    essayLen: essay.length,
    quoteCount: matches.length,
    q1HeaderCount: q1headers.length,
    deskQueueLen: (userState.deskQueue || []).length
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
process.exit(result.quoteCount <= 2 && result.q1HeaderCount <= 2 ? 0 : 1);
