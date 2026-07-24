import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const notes = [];
const cardHeader = ["牌組ID", "牌組名稱", "牌組圖示", "卡牌名稱", "說明", "卡牌圖示", "抽選池圖示", "圖片", "稀有度", "標籤"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV 有未關閉的引號");
  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
}

function relative(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function csvRows(filePath) {
  try {
    return parseCsv(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (error) {
    failures.push(`${relative(filePath)} 無法解析：${error.message}`);
    return [];
  }
}

function sameValues(actual, expected) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

const cardFiles = fs.readdirSync(path.join(root, "data/cards"))
  .filter((name) => name.endsWith(".csv"))
  .sort()
  .map((name) => path.join(root, "data/cards", name));
const deckIds = new Set();

for (const filePath of cardFiles) {
  const rows = csvRows(filePath);
  if (!rows.length) continue;
  if (!sameValues(rows[0], cardHeader)) {
    failures.push(`${relative(filePath)} 欄位必須精確為 ${cardHeader.join("、")}`);
    continue;
  }
  const cardKeys = new Set();
  const metadata = new Set();
  for (const [offset, row] of rows.slice(1).entries()) {
    const line = offset + 2;
    if (row.length !== cardHeader.length) {
      failures.push(`${relative(filePath)}:${line} 有 ${row.length} 欄，應為 ${cardHeader.length} 欄`);
      continue;
    }
    const [deckId, deckLabel, deckIcon, name, description, , , , rarity] = row;
    if (!deckId || !deckLabel || !deckIcon || !name || !description) {
      failures.push(`${relative(filePath)}:${line} 缺少牌組或卡牌必要欄位`);
    }
    const cardKey = `${rarity}\u0000${name}`;
    if (cardKeys.has(cardKey)) failures.push(`${relative(filePath)}:${line} 同一子池卡牌重複：${name}`);
    cardKeys.add(cardKey);
    metadata.add(`${deckId}\u0000${deckLabel}\u0000${deckIcon}`);
    deckIds.add(deckId);
  }
  if (metadata.size !== 1) failures.push(`${relative(filePath)} 的牌組 ID、名稱或圖示不一致`);
  notes.push(`${relative(filePath)}: ${Math.max(0, rows.length - 1)} 張`);
}

const contentContracts = new Map([
  ["data/content/介面文字.csv", ["文字ID", "內容", "說明"]],
  ["data/content/手機介面文字.csv", ["文字ID", "玩法ID", "區域", "內容", "說明"]],
  ["data/content/玩法文案.csv", ["玩法ID", "欄位", "序號", "標題", "內容"]],
  ["data/content/玩法設定.csv", ["玩法ID", "玩法名稱", "選項短句", "選項色系"]]
]);

const contentRows = new Map();
for (const [relativePath, expectedHeader] of contentContracts) {
  const rows = csvRows(path.join(root, relativePath));
  contentRows.set(relativePath, rows);
  if (!rows.length || !sameValues(rows[0], expectedHeader)) {
    failures.push(`${relativePath} 欄位契約不符：${expectedHeader.join("、")}`);
  }
  for (const [offset, row] of rows.slice(1).entries()) {
    if (row.length !== expectedHeader.length) failures.push(`${relativePath}:${offset + 2} 欄位數不符`);
  }
}

const modeFiles = fs.readdirSync(path.join(root, "data/modes"))
  .filter((name) => name.endsWith(".json"))
  .sort();
const modes = modeFiles.map((name) => {
  const relativePath = `data/modes/${name}`;
  try {
    return { relativePath, value: JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) };
  } catch (error) {
    failures.push(`${relativePath} 不是有效 JSON：${error.message}`);
    return null;
  }
}).filter(Boolean);
const modeIds = new Set(modes.map(({ value }) => value.id));
if (modeIds.size !== modes.length) failures.push("data/modes/ 有重複玩法 ID");
const modeOrders = new Set();
const virtualDeckIds = new Set(["needs"]);

for (const { relativePath, value } of modes) {
  for (const key of ["id", "order", "title", "cardMode", "primaryDeck"]) {
    if (value[key] === undefined || value[key] === "") failures.push(`${relativePath} 缺少 ${key}`);
  }
  if (modeOrders.has(value.order)) failures.push(`${relativePath} 的 order ${value.order} 與其他玩法重複`);
  modeOrders.add(value.order);
  const referencedDecks = [
    value.primaryDeck,
    value.secondaryDeck,
    ...(value.variantDecks || []),
    ...(value.metaphorConcreteDecks || []),
    ...(value.metaphorDecks || []),
    ...(value.metaphorFreeDecks || []),
    ...(value.salesAudienceDecks || [])
  ].filter(Boolean);
  for (const deckId of referencedDecks) {
    if (!deckIds.has(deckId) && !virtualDeckIds.has(deckId)) failures.push(`${relativePath} 引用不存在的牌組：${deckId}`);
  }
}

for (const relativePath of ["data/content/玩法設定.csv", "data/content/玩法文案.csv"]) {
  const ids = new Set((contentRows.get(relativePath) || []).slice(1).map((row) => row[0]).filter(Boolean));
  for (const modeId of modeIds) if (!ids.has(modeId)) failures.push(`${relativePath} 缺少玩法 ${modeId}`);
  for (const modeId of ids) if (!modeIds.has(modeId)) failures.push(`${relativePath} 有未知玩法 ${modeId}`);
}

const settingsRows = (contentRows.get("data/content/玩法設定.csv") || []).slice(1);
if (new Set(settingsRows.map((row) => row[0])).size !== settingsRows.length) failures.push("data/content/玩法設定.csv 有重複玩法 ID");

const lifeConceptRows = csvRows(path.join(root, "data/cards/概念卡.csv")).slice(1)
  .filter((row) => row[3] === "人生" && row[8] === "人生");
const lifeRelationRows = csvRows(path.join(root, "data/cards/關係卡.csv")).slice(1)
  .filter((row) => row[3] === "就像" && row[8] === "人生");
if (lifeConceptRows.length !== 1) failures.push("概念卡.csv 必須恰有一張名稱與稀有度皆為「人生」的固定卡");
if (lifeRelationRows.length !== 1) failures.push("關係卡.csv 必須恰有一張名稱為「就像」、稀有度為「人生」的固定卡");

if (failures.length) {
  console.error("資料契約檢查失敗：\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("資料契約檢查通過。");
for (const note of notes) console.log(`- ${note}`);
console.log(`- ${modes.length} 個玩法 JSON 與內容索引一致`);
