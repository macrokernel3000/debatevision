import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const notes = [];

const lineBudgets = new Map([
  ["website/js/app.js", 3150],
  ["website/styles/tokens.css", 120],
  ["website/styles/main.css", 3020],
  ["website/styles/mobile.css", 2000],
  ["website/js/mobile-render.js", 400],
  ["website/js/mobile-app.js", 350],
  ["scripts/build-lexicons.mjs", 550]
]);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function lineCount(relativePath) {
  const content = read(relativePath);
  return content === "" ? 0 : content.split(/\r?\n/).length;
}

function checkBudget(relativePath, maximum) {
  const actual = lineCount(relativePath);
  if (actual > maximum) {
    failures.push(
      `${relativePath} 有 ${actual} 行，超過 ${maximum} 行預算。請先把新功能拆到 core / components / modes，而不是提高上限。`
    );
    return;
  }
  notes.push(`${relativePath}: ${actual}/${maximum}`);
}

function listFiles(relativeDirectory, suffix) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  if (!fs.existsSync(absoluteDirectory)) return [];
  return fs.readdirSync(absoluteDirectory)
    .filter((name) => name.endsWith(suffix))
    .map((name) => path.posix.join(relativeDirectory, name))
    .sort();
}

function requireInOrder(content, relativePath, needles) {
  let previousIndex = -1;
  for (const needle of needles) {
    const index = content.indexOf(needle);
    if (index < 0) {
      failures.push(`${relativePath} 缺少必要載入項目：${needle}`);
      continue;
    }
    if (index <= previousIndex) {
      failures.push(`${relativePath} 載入順序錯誤：${needle}`);
    }
    previousIndex = index;
  }
}

for (const [relativePath, maximum] of lineBudgets) {
  checkBudget(relativePath, maximum);
}

for (const relativePath of listFiles("website/js/core", ".js")) {
  checkBudget(relativePath, 400);
}
for (const relativePath of listFiles("website/js/components", ".js")) {
  checkBudget(relativePath, 500);
}
for (const relativePath of listFiles("website/js/services", ".js")) {
  checkBudget(relativePath, 400);
}
for (const relativePath of listFiles("website/js/modes", ".js")) {
  checkBudget(relativePath, 300);
}
for (const relativePath of listFiles("website/styles/components", ".css")) {
  checkBudget(relativePath, 500);
}

const indexHtml = read("website/index.html");
requireInOrder(indexHtml, "website/index.html", [
  "./styles/tokens.css",
  "./styles/components/draw-machine.css",
  "./styles/main.css",
  "./styles/components/class-timer.css",
  "./styles/components/deck-option-cards.css",
  "./styles/mobile.css",
  "./styles/viewport-boundaries.css"
]);
requireInOrder(indexHtml, "website/index.html", [
  "../data/generated/ui-texts.js",
  "./js/core/state.js",
  "./js/core/ui-text.js",
  "./js/core/decks.js",
  "./js/services/history-service.js",
  "./js/services/timer-service.js",
  "./js/services/image-service.js",
  "./js/mobile-render.js",
  "./js/components/class-timer.js",
  "./js/components/deck-option-cards.js",
  "./js/components/image-editor.js",
  "./js/components/cards.js",
  "./js/components/survival-battle-view.js",
  "./js/app.js",
  "./js/mobile-app.js"
]);

const appTopLevelStateCount = (read("website/js/app.js").match(/^let\s+/gm) || []).length;
if (appTopLevelStateCount > 35) {
  failures.push(
    `website/js/app.js 有 ${appTopLevelStateCount} 個頂層可變狀態，超過 35 個基準。新狀態請放進 core/state.js 建立的分域 state。`
  );
} else {
  notes.push(`website/js/app.js top-level state: ${appTopLevelStateCount}/35`);
}

for (const marker of ['data-ui-surface="desktop"', 'data-ui-surface="mobile"']) {
  if (!indexHtml.includes(marker)) {
    failures.push(`website/index.html 缺少 ${marker}，桌機與手機邊界將失去保護。`);
  }
}

const boundaryCss = read("website/styles/viewport-boundaries.css");
for (const selector of ['[data-ui-surface="desktop"]', '[data-ui-surface="mobile"]']) {
  if (!boundaryCss.includes(selector)) {
    failures.push(`website/styles/viewport-boundaries.css 缺少 ${selector}。`);
  }
}

for (const relativePath of [
  "website/styles/main.css",
  "website/styles/mobile.css",
  "website/styles/components/class-timer.css",
  "website/styles/components/deck-option-cards.css"
]) {
  if (read(relativePath).includes("[data-ui-surface=")) {
    failures.push(
      `${relativePath} 不應控制 data-ui-surface；桌機／手機顯示邊界只能放在 viewport-boundaries.css。`
    );
  }
}

if (failures.length > 0) {
  console.error("架構檢查失敗：\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error("\n新增功能的正確放置方式請讀 docs/Architecture_Guardrails.md。");
  process.exit(1);
}

console.log("架構檢查通過。");
notes.forEach((note) => console.log(`- ${note}`));
