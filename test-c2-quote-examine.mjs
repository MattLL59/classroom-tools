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
  freeSelectFromText: true
});
if (Array.isArray(lesson.questions) && lesson.questions[0]) {
  lesson.questions[0].prompt = "(a) Give one detail from the passage. [1]";
}
lesson.userState = Object.assign({}, lesson.userState || {}, { view: "desk", level: 1 });

const server = createServer((req, res) => {
  const f = req.url.split("?")[0].replace(/^\//, "") || "architect_v131.html";
  try { res.writeHead(200); res.end(readFileSync(join(root, f))); } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(8774, r));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"], protocolTimeout: 120000 });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8774/architect_v131.html?recovery=1", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate((d) => localStorage.setItem("tsa_v5_1_data", JSON.stringify(d)), lesson);
await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done"), { timeout: 60000 });

const routing = await page.evaluate(() => {
  appData.component = 2;
  if (!appData.settings.levelBank) appData.settings.levelBank = {};
  appData.settings.levelBank[1] = Object.assign({}, appData.settings.levelBank[1] || {}, {
    shortAnswersOnly: true,
    freeSelectFromText: true
  });
  if (Array.isArray(appData.questions) && appData.questions[0]) {
    appData.questions[0].prompt = "(a) Give one detail from the passage. [1]";
  }
  userState.level = 1;
  return {
  component: app.getArchitectComponent(),
  quoteOnly: app.isQuoteOnlyShortAnswerLevel(1),
  verbatim: app.quoteSelectVerbatimRoutesToDesk(1),
  paraphraseRoute: app.quoteSelectParaphraseRoutesToDesk(1),
  needsPara: app.quoteNeedsParaphraseBeforeDesk("x", 1),
  opensSelect: userState.view === "select"
};
});

const examineUi = await page.evaluate(() => {
  userState.level = 1;
  ui._freeSelectPendingQuote = "The wind tore through the broken shutters";
  ui.renderSelection(null, { skipPassage: true });
  return {
    hasWhy: !!document.getElementById("free-select-why"),
    examine: document.querySelector("#selection-area .section-header")?.textContent || "",
    useLabel: document.getElementById("free-select-use")?.textContent || ""
  };
});

const desk = await page.evaluate(() => {
  ui.sendSelectionQuotesDirectToAnswer({
    openDeskAfterSave: true,
    onlyQuotes: ["The wind tore through the broken shutters"]
  });
  const essay = document.getElementById("essay-area")?.value || "";
  const body = essay.replace(/^(?:Question\s+\d+|Q\d+\s*[.:)]?\s*|\[Q\d+\]\s*)/i, "").trim();
  return {
    onDesk: userState.view === "desk",
    essayHasQuote: /wind|shutter/i.test(body)
  };
});

const result = { ...routing, ...examineUi, ...desk };
console.log(JSON.stringify(result, null, 2));
await browser.close();
server.close();
const ok = result.component === 2 && result.quoteOnly && result.verbatim && !result.paraphraseRoute && !result.needsPara
  && result.opensSelect && !result.hasWhy
  && /Examine your quote/i.test(result.examine)
  && /Writing Desk/i.test(result.useLabel)
  && result.onDesk && result.essayHasQuote;
process.exit(ok ? 0 : 1);
