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
await new Promise((r) => server.listen(8771, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8771/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded" });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"));
await page.evaluate(() => ui.switchView("select", true));
await page.waitForSelector("#source-inline-select .source-line-text");

const result = await page.evaluate(async () => {
  userState.level = 1;
  appData.isStandalone = false;
  appData.items = [];
  userState.selectionChosen = [];
  userState.selectionJustification = {};

  const line = document.querySelector("#source-inline-select .source-line-text");
  const textNode = line.firstChild;
  const quote = textNode.textContent.slice(0, 35).trim();
  const range = document.createRange();
  range.setStart(textNode, 0);
  range.setEnd(textNode, Math.min(35, textNode.textContent.length));
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  const mouseUp = new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window });
  document.dispatchEvent(mouseUp);
  await new Promise((r) => setTimeout(r, 400));

  const pending = String(ui._freeSelectPendingQuote || "").trim();
  const examineTitle = document.querySelector("#selection-area .section-header")?.textContent || "";
  const hasWhyBox = !!document.getElementById("free-select-why");
  const chosenLen = (userState.selectionChosen || []).length;

  if (hasWhyBox) {
    document.getElementById("free-select-why").value = "Student paraphrase for the fact";
    document.getElementById("free-select-use").click();
    await new Promise((r) => setTimeout(r, 400));
  }

  const onDesk = userState.view === "desk";
  const essay = document.getElementById("essay-area")?.value || "";

  return {
    quoteSample: quote.slice(0, 30),
    pendingAfterHighlight: pending,
    examineTitle,
    hasWhyBox,
    chosenLenAfterHighlight: chosenLen,
    onDesk,
    essayLen: essay.length,
    hasParaphrase: essay.toLowerCase().includes("paraphrase"),
    routesToDesk: app.quoteSelectParaphraseRoutesToDesk(1),
    ownWords: app.sendsOwnWordsParaphraseFromQuoteSelect(1)
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = result.pendingAfterHighlight.length > 5 && result.hasWhyBox && result.onDesk && result.hasParaphrase;
process.exit(ok ? 0 : 1);
