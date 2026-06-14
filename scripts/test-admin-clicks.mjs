#!/usr/bin/env node
import puppeteer from "puppeteer-core";

const url = process.argv[2] || "https://mattll59.github.io/classroom-tools/architect_v131.html?recovery=1&b=20260614000000";

const browser = await puppeteer.launch({
  executablePath: "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"]
});

const page = await browser.newPage();
page.setDefaultTimeout(90000);

const logs = [];
const errors = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => errors.push(err.message));
page.on("requestfailed", (req) => errors.push("fail:" + req.url()));

await page.goto(url, { waitUntil: "networkidle0" });
await page.waitForFunction(() => document.body.classList.contains("tsa-init-done") || window.__tsaBootComplete, { timeout: 60000 }).catch(() => {});

const stamp = await page.$eval("#arch-build-stamp", (el) => el.textContent).catch(() => "?");
console.log("stamp:", stamp);

await page.click("#btn-admin").catch((e) => console.log("data click err:", e.message));
await new Promise((r) => setTimeout(r, 500));

const modalOpen = await page.evaluate(() => {
  const m = document.getElementById("modal-admin");
  return !!(m && m.classList.contains("open"));
});
console.log("modal open:", modalOpen);

const tabReward = await page.$('#admin-tabs .tab-btn[data-tab="reward"]');
if(tabReward) {
  await tabReward.click();
  await new Promise((r) => setTimeout(r, 300));
}

const result = await page.evaluate(async () => {
  const active = document.querySelector("#admin-tabs .tab-btn.active");
  const wired = document.querySelectorAll("#modal-admin button[data-admin-wired]").length;
  const withOnclick = document.querySelectorAll("#modal-admin button[onclick]").length;
  const adm = document.getElementById("modal-admin");
  const rewardBtn = document.querySelector('#admin-tabs .tab-btn[data-tab="reward"]');
  let tabSwitchOk = false;
  if(rewardBtn && window.admin && admin.goAdminTab) {
    try { admin.goAdminTab("reward"); tabSwitchOk = document.querySelector("#admin-tabs .tab-btn.active")?.dataset.tab === "reward"; } catch(e) {}
  }
  return {
    activeTab: active ? active.dataset.tab : null,
    tabSwitchOk,
    wired,
    withOnclick,
    boot: !!window.__tsaBootInProgress,
    bootDone: !!window.__tsaBootComplete,
    initDone: document.body.classList.contains("tsa-init-done"),
    delegateBound: adm ? adm.dataset.adminPanelDelegateBound : null,
    chromeBound: document.body.dataset.adminChromeBound,
    appReady: typeof window.app !== "undefined",
    adminReady: typeof window.admin !== "undefined"
  };
});

console.log("click test:", JSON.stringify(result, null, 2));
if(errors.length) console.log("errors:", errors.slice(0, 10).join("\n"));
if(logs.length) console.log("console:", logs.slice(-8).join("\n"));

await browser.close();
