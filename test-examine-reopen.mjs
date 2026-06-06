import puppeteer from "puppeteer";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";

const root = "/workspace";
const html = readFileSync(join(root, "lessona.html"), "utf8");
const lesson = eval("(" + html.match(/window\.STANDALONE_LESSON\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/)[1] + ")");
lesson.isStandalone = false;
if (lesson.settings?.levelBank?.[1]) lesson.settings.levelBank[1].shortAnswersOnly = true;

const server = createServer((req, res) => {
  const f = req.url.split("?")[0].replace(/^\//, "") || "architect_v131.html";
  try { res.writeHead(200); res.end(readFileSync(join(root, f))); } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8773, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8773/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));
await page.evaluate(() => ui.switchView("select", true));

const result = await page.evaluate(async () => {
  userState.level = 1;
  appData.isStandalone = false;
  userState.selectionChosen = ["The sky was a bruised purple at dusk"];
  userState.selectionJustification = {};
  ui._freeSelectPendingQuote = "";
  ui.sendSelectionQuotesDirectToAnswer({ stayOnQuoteSelect: true });
  await new Promise((r) => setTimeout(r, 200));
  return {
    hasExamine: !!document.getElementById("free-select-why"),
    pending: String(ui._freeSelectPendingQuote || "").slice(0, 20)
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
process.exit(result.hasExamine && result.pending.length > 5 ? 0 : 1);
