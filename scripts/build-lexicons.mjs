import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(root, "data", "lexicons.csv");
const decksDir = resolve(root, "data", "decks");
const outputPath = resolve(root, "js", "generated-lexicons.js");

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

const decks = {};

function readDeckRows() {
  if (existsSync(decksDir)) {
    const files = readdirSync(decksDir)
      .filter((file) => file.toLowerCase().endsWith(".csv"))
      .sort();

    if (files.length) {
      return files.flatMap((file) => {
        const rows = parseCsv(readFileSync(resolve(decksDir, file), "utf8"));
        const [headers, ...records] = rows;
        const cleanHeaders = headers.map((header) => header.replace(/^\uFEFF/, "").trim());
        return records.map((record) => Object.fromEntries(cleanHeaders.map((header, index) => [header, record[index] || ""])));
      });
    }
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const [headers, ...records] = rows;
  const cleanHeaders = headers.map((header) => header.replace(/^\uFEFF/, "").trim());
  return records.map((record) => Object.fromEntries(cleanHeaders.map((header, index) => [header, record[index] || ""])));
}

for (const item of readDeckRows()) {
  if (!item.deck_id || !item.name) continue;

  decks[item.deck_id] ||= {
    label: item.deck_label || item.deck_id,
    icon: item.deck_icon || "□",
    cards: []
  };

  decks[item.deck_id].cards.push({
    name: item.name,
    lore: item.description,
    icon: item.icon,
    image: item.image,
    rarity: item.rarity || "普通",
    tags: item.tags ? item.tags.split("|").map((tag) => tag.trim()).filter(Boolean) : []
  });
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `window.DEBATE_DECKS = ${JSON.stringify(decks, null, 2)};\n`,
  "utf8"
);

console.log(`已更新 ${outputPath}`);
