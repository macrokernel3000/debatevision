import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cardsDir = resolve(root, "data", "cards");
const modesDir = resolve(root, "data", "modes");
const modeContentPath = resolve(root, "data", "content", "玩法文案.csv");
const modeSettingsPath = resolve(root, "data", "content", "玩法設定.csv");
const uiContentPath = resolve(root, "data", "content", "介面文字.csv");
const mobileUiContentPath = resolve(root, "data", "content", "手機介面文字.csv");
const imageLayoutsDir = resolve(root, "data", "image-layouts");
const generatedDir = resolve(root, "data", "generated");
const fallbackCsvPath = resolve(root, "docs", "archive", "legacy", "總詞庫備份.csv");

const headerAliases = {
  "牌組ID": "deck_id",
  "牌組代號": "deck_id",
  "deck_id": "deck_id",
  "牌組名稱": "deck_label",
  "牌組標籤": "deck_label",
  "deck_label": "deck_label",
  "牌組圖示": "deck_icon",
  "deck_icon": "deck_icon",
  "卡牌名稱": "name",
  "名稱": "name",
  "name": "name",
  "說明": "description",
  "描述": "description",
  "description": "description",
  "卡牌圖示": "icon",
  "圖示": "icon",
  "icon": "icon",
  "抽選池圖示": "token_icon",
  "抽選圖示": "token_icon",
  "小圖示": "token_icon",
  "token_icon": "token_icon",
  "tokenIcon": "token_icon",
  "圖片": "image",
  "image": "image",
  "稀有度": "rarity",
  "rarity": "rarity",
  "標籤": "tags",
  "tags": "tags",
  "玩法ID": "mode_id",
  "玩法代號": "mode_id",
  "mode_id": "mode_id",
  "文字ID": "key",
  "文字代號": "key",
  "key": "key",
  "欄位": "field",
  "field": "field",
  "序號": "order",
  "順序": "order",
  "order": "order",
  "標題": "title",
  "title": "title",
  "內容": "content",
  "文字": "content",
  "content": "content",
  "選項短句": "menu_label",
  "選單短句": "menu_label",
  "右上短句": "menu_label",
  "menu_label": "menu_label",
  "menuLabel": "menu_label",
  "選項色系": "palette",
  "色系": "palette",
  "palette": "palette",
  "介面文字": "text",
  "text": "text",
  "備註": "note",
  "note": "note"
};

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
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  return rows;
}

function normalizeHeader(header) {
  const clean = header.replace(/^\uFEFF/, "").trim();
  return headerAliases[clean] || clean;
}

function csvObjects(text) {
  const rows = parseCsv(text);
  const [headers, ...records] = rows;
  const cleanHeaders = headers.map((header) => normalizeHeader(header));
  return records.map((record) => Object.fromEntries(cleanHeaders.map((header, index) => [header, record[index] || ""])));
}

function csvCardObjects(text) {
  const rows = parseCsv(text);
  const [headers = [], ...records] = rows;
  const cleanHeaders = headers.map((header) => normalizeHeader(header));
  const hasHeader = cleanHeaders.includes("deck_id") && cleanHeaders.includes("name");
  const cardHeaders = ["deck_id", "deck_label", "deck_icon", "name", "description", "icon", "token_icon", "image", "rarity", "tags"];
  const dataRows = hasHeader ? records : rows;
  const activeHeaders = hasHeader ? cleanHeaders : cardHeaders;

  return dataRows.map((record) => Object.fromEntries(activeHeaders.map((header, index) => [header, record[index] || ""])));
}

function readCardRows() {
  if (existsSync(cardsDir)) {
    const csvFiles = readdirSync(cardsDir)
      .filter((file) => extname(file).toLowerCase() === ".csv")
      .sort();

    if (csvFiles.length) {
      return csvFiles.flatMap((file) => csvCardObjects(readFileSync(join(cardsDir, file), "utf8")));
    }
  }

  return csvCardObjects(readFileSync(fallbackCsvPath, "utf8"));
}

function assetPathFor(item) {
  const rawIcon = (item.icon || "").replace(/[\r\n\t]+/g, "").trim();
  const icon = rawIcon.replace(/\.(svg|png|webp|jpe?g)$/i, "");
  const explicitExtension = rawIcon.match(/\.(svg|png|webp|jpe?g)$/i)?.[0]?.toLowerCase() || "";
  if (!icon) return "";

  const iconDir = resolve(root, "assets", "icons", item.deck_id);
  const extensions = explicitExtension
    ? [explicitExtension, ...[".png", ".webp", ".jpg", ".jpeg", ".svg"].filter((extension) => extension !== explicitExtension)]
    : [".png", ".webp", ".jpg", ".jpeg", ".svg"];
  const directBase = resolve(iconDir, icon);

  for (const extension of extensions) {
    const directPath = `${directBase}${extension}`;
    if (existsSync(directPath)) {
      return `../assets/icons/${item.deck_id}/${icon}${extension}`;
    }
  }

  if (existsSync(iconDir)) {
    const expectedNames = extensions.map((extension) => `${icon}${extension}`.toLowerCase());
    const match = readdirSync(iconDir).find((file) => expectedNames.includes(file.toLowerCase()));
    if (match) {
      return `../assets/icons/${item.deck_id}/${match}`;
    }
  }

  return "";
}

function imagePathFor(item) {
  const rawImage = (item.image || "").replace(/[\r\n\t]+/g, "").trim();
  if (!rawImage) return "";
  if (/^(https?:|data:|\.{0,2}\/)/i.test(rawImage)) return rawImage;

  const image = rawImage.replace(/\.(svg|png|webp|jpe?g)$/i, "");
  const explicitExtension = rawImage.match(/\.(svg|png|webp|jpe?g)$/i)?.[0]?.toLowerCase() || "";
  const imageDir = resolve(root, "assets", "icons", item.deck_id);
  const extensions = explicitExtension
    ? [explicitExtension, ...[".png", ".webp", ".jpg", ".jpeg", ".svg"].filter((extension) => extension !== explicitExtension)]
    : [".png", ".webp", ".jpg", ".jpeg", ".svg"];
  const directBase = resolve(imageDir, image);

  for (const extension of extensions) {
    const directPath = `${directBase}${extension}`;
    if (existsSync(directPath)) {
      return `../assets/icons/${item.deck_id}/${image}${extension}`;
    }
  }

  if (existsSync(imageDir)) {
    const expectedNames = extensions.map((extension) => `${image}${extension}`.toLowerCase());
    const match = readdirSync(imageDir).find((file) => expectedNames.includes(file.toLowerCase()));
    if (match) {
      return `../assets/icons/${item.deck_id}/${match}`;
    }
  }

  return rawImage;
}

function imageIdFor(item) {
  const raw = (item.image || item.icon || "")
    .replace(/[\r\n\t]+/g, "")
    .trim()
    .split(/[\\/]/)
    .pop() || "";
  return raw.replace(/\.(svg|png|webp|jpe?g)$/i, "");
}

function buildDecks() {
  const decks = {};

  for (const item of readCardRows()) {
    if (!item.deck_id || !item.name) continue;

    decks[item.deck_id] ||= {
      label: item.deck_label || item.deck_id,
      icon: item.deck_icon || "□",
      cards: []
    };

    const iconAsset = assetPathFor(item);
    const imageId = imageIdFor(item);
    const image = imagePathFor(item);

    decks[item.deck_id].cards.push({
      name: item.name,
      lore: item.description,
      imageId,
      icon: iconAsset ? "" : item.icon,
      iconAsset,
      tokenIcon: item.token_icon || "",
      image,
      rarity: item.rarity || "C",
      tags: item.tags ? item.tags.split("|").map((tag) => tag.trim()).filter(Boolean) : []
    });
  }

  return decks;
}

function buildModes() {
  if (!existsSync(modesDir)) return [];

  const modes = readdirSync(modesDir)
    .filter((file) => extname(file).toLowerCase() === ".json")
    .sort()
    .map((file) => JSON.parse(readFileSync(join(modesDir, file), "utf8")))
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return sortModes(applyModeSettings(applyModeContent(modes)));
}

function sortModes(modes) {
  return [...modes].sort((a, b) => {
    if (a.id === "card-dictionary" && b.id !== "card-dictionary") return 1;
    if (b.id === "card-dictionary" && a.id !== "card-dictionary") return -1;
    return (Number(a.order) || 999) - (Number(b.order) || 999);
  });
}

function buildImageLayouts() {
  const layouts = {};
  if (!existsSync(imageLayoutsDir)) return layouts;

  for (const file of readdirSync(imageLayoutsDir).filter((name) => extname(name).toLowerCase() === ".json").sort()) {
    const deckId = file.replace(/\.json$/i, "");
    try {
      layouts[deckId] = JSON.parse(readFileSync(join(imageLayoutsDir, file), "utf8"));
    } catch (error) {
      console.warn(`略過無法讀取的圖片設定 ${file}: ${error.message}`);
    }
  }

  return layouts;
}

function fieldKey(value) {
  const clean = (value || "").trim();
  const aliases = {
    "玩法名稱": "title",
    "名稱": "title",
    "title": "title",
    "活動軌道": "track",
    "玩法分類": "track",
    "track": "track",
    "描述": "description",
    "玩法描述": "description",
    "說明": "description",
    "description": "description",
    "活動規則": "controlRule",
    "一句規則": "controlRule",
    "中間提示": "controlRule",
    "controlRule": "controlRule",
    "狀態說明": "statusRule",
    "版本說明": "statusRule",
    "狀態提示": "statusRule",
    "statusRule": "statusRule",
    "statusRules": "statusRule",
    "按鈕文字": "drawLabel",
    "抽卡按鈕": "drawLabel",
    "drawLabel": "drawLabel",
    "玩法背景": "image",
    "背景圖": "image",
    "首頁背景": "image",
    "image": "image",
    "backgroundImage": "backgroundImage",
    "教練提示": "prompt",
    "提示": "prompt",
    "prompt": "prompt",
    "卡牌任務": "cardHook",
    "卡牌提示": "cardHook",
    "卡詞": "cardHook",
    "cardHook": "cardHook",
    "cardHooks": "cardHook",
    "回合流程": "flow",
    "流程": "flow",
    "flow": "flow"
  };
  return aliases[clean] || clean;
}

function sortRows(rows) {
  return [...rows].sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
}

function applyModeContent(modes) {
  if (!existsSync(modeContentPath)) return modes;

  const rows = csvObjects(readFileSync(modeContentPath, "utf8")).filter((row) => row.mode_id && row.field);
  const rowsByMode = new Map();
  for (const row of rows) {
    const key = row.mode_id.trim();
    rowsByMode.set(key, [...(rowsByMode.get(key) || []), row]);
  }

  return modes.map((mode) => {
    const contentRows = rowsByMode.get(mode.id) || [];
    if (!contentRows.length) return mode;

    const nextMode = { ...mode };
    const prompts = [];
    const cardHooks = [];
    const flow = [];
    const statusRules = {};

    for (const row of sortRows(contentRows)) {
      const field = fieldKey(row.field);
      const content = (row.content || "").trim();
      const title = (row.title || "").trim();
      if (!content && !title) continue;

      if (["title", "track", "description", "controlRule", "drawLabel", "image", "backgroundImage"].includes(field)) {
        nextMode[field] = content || title;
      }

      if (field === "prompt") {
        prompts.push([title || `提示 ${prompts.length + 1}`, content]);
      }

      if (field === "cardHook") {
        cardHooks.push(content || title);
      }

      if (field === "flow") {
        flow.push(content || title);
      }

      if (field === "statusRule") {
        const statusKey = title || "default";
        statusRules[statusKey] = content || title;
      }
    }

    if (prompts.length) nextMode.prompts = prompts;
    if (cardHooks.length) nextMode.cardHooks = cardHooks;
    if (flow.length) nextMode.flow = flow;
    if (Object.keys(statusRules).length) nextMode.statusRules = statusRules;

    return nextMode;
  });
}

function applyModeSettings(modes) {
  if (!existsSync(modeSettingsPath)) return modes;

  const rows = csvObjects(readFileSync(modeSettingsPath, "utf8"));
  const settingsByMode = new Map();
  for (const row of rows) {
    const modeId = (row.mode_id || "").trim();
    if (!modeId) continue;
    settingsByMode.set(modeId, row);
  }

  return modes.map((mode) => {
    const setting = settingsByMode.get(mode.id);
    if (!setting) return mode;

    const nextMode = { ...mode };
    const title = (setting.title || "").trim();
    const menuLabel = (setting.menu_label || "").trim();
    const palette = (setting.palette || "").trim();

    if (title) nextMode.title = title;
    if (menuLabel) nextMode.menuLabel = menuLabel;
    if (palette) nextMode.palette = palette;

    return nextMode;
  });
}

function buildUiTexts() {
  const texts = {};
  for (const path of [uiContentPath, mobileUiContentPath]) {
    if (!existsSync(path)) continue;
    for (const row of csvObjects(readFileSync(path, "utf8"))) {
      const key = (row.key || "").trim();
      const value = (row.content || row.text || "").trim();
      if (!key) continue;
      texts[key] = value;
    }
  }
  return texts;
}

mkdirSync(generatedDir, { recursive: true });

const decks = buildDecks();
const modes = buildModes();
const imageLayouts = buildImageLayouts();
const uiTexts = buildUiTexts();

writeFileSync(
  resolve(generatedDir, "decks.js"),
  `window.DEBATE_DECKS = ${JSON.stringify(decks, null, 2)};\n`,
  "utf8"
);

writeFileSync(
  resolve(generatedDir, "modes.js"),
  `window.DEBATE_MODES = ${JSON.stringify(modes, null, 2)};\n`,
  "utf8"
);

writeFileSync(
  resolve(generatedDir, "image-layouts.js"),
  `window.DEBATE_IMAGE_LAYOUTS = ${JSON.stringify(imageLayouts, null, 2)};\n`,
  "utf8"
);

writeFileSync(
  resolve(generatedDir, "ui-texts.js"),
  `window.DEBATE_UI_TEXTS = ${JSON.stringify(uiTexts, null, 2)};\n`,
  "utf8"
);

console.log(`已更新 ${resolve(generatedDir, "decks.js")}`);
console.log(`已更新 ${resolve(generatedDir, "modes.js")}`);
console.log(`已更新 ${resolve(generatedDir, "image-layouts.js")}`);
console.log(`已更新 ${resolve(generatedDir, "ui-texts.js")}`);
