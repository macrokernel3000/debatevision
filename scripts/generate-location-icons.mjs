import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(root, "data", "cards", "場地卡.csv");
const iconDir = resolve(root, "assets", "icons", "locations");

const locations = [
  ["舞台戲劇院", "location_stage_theater", "舞"],
  ["工地", "location_construction_site", "工"],
  ["潛水艇", "location_submarine", "潛"],
  ["飛機", "location_airplane", "飛"],
  ["體育場", "location_stadium", "體"],
  ["圖書館", "location_library", "書"],
  ["太空站", "location_space_station", "宇"],
  ["馬戲團", "location_circus", "馬"],
  ["動物園", "location_zoo", "動"],
  ["大賣場", "location_hypermarket", "賣"],
  ["警察局", "location_police_station", "警"],
  ["電影攝影棚", "location_film_studio", "影"],
  ["海盜船", "location_pirate_ship", "船"],
  ["沙灘", "location_beach", "沙"],
  ["廚藝學校", "location_culinary_school", "廚"],
  ["天堂", "location_heaven", "天"],
  ["監獄", "location_prison", "監"],
  ["學校", "location_school", "學"],
  ["夜市", "location_night_market", "市"],
  ["農場", "location_farm", "農"],
  ["戰場", "location_battlefield", "戰"],
  ["育嬰室", "location_nursery", "嬰"],
  ["實驗室", "location_laboratory", "實"],
  ["競技場", "location_arena", "競"],
  ["紡織廠", "location_textile_factory", "織"],
  ["公園廣場", "location_park_square", "園"],
  ["博物館", "location_museum", "博"],
  ["月球基地", "location_moon_base", "月"],
  ["罐頭工廠", "location_cannery", "罐"],
  ["商業大樓", "location_office_tower", "商"]
];

const iconByName = new Map(locations.map(([name, id]) => [name, id]));

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

function serializeCsv(rows) {
  return `${rows.map((row) => row.map(formatCell).join(",")).join("\r\n")}\r\n`;
}

function formatCell(cell) {
  const value = String(cell ?? "");
  if (/[",\r\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function svgFor(label, index) {
  const palette = [
    ["#0f7f78", "#d4971d"],
    ["#246a91", "#d94f30"],
    ["#5d4bb0", "#19a184"],
    ["#8a5b1f", "#2d8275"],
    ["#ad3d39", "#d6a326"]
  ][index % 5];
  const [primary, accent] = palette;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" role="img" aria-label="${label} icon">
  <rect width="88" height="88" rx="18" fill="#f7efe1"/>
  <rect x="7" y="7" width="74" height="74" rx="15" fill="#fffaf0" stroke="#2b2b2b" stroke-width="3"/>
  <circle cx="44" cy="39" r="23" fill="${primary}" opacity="0.16"/>
  <path d="M24 58h40M30 64h28" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>
  <path d="M44 16v10M44 62v10M16 44h10M62 44h10" fill="none" stroke="${primary}" stroke-width="4" stroke-linecap="round" opacity="0.85"/>
  <text x="44" y="52" text-anchor="middle" font-family="Arial, 'PingFang TC', 'Noto Sans TC', sans-serif" font-size="28" font-weight="900" fill="#171717">${label}</text>
</svg>
`;
}

function updateCsv() {
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const header = rows[0].map((cell) => cell.replace(/^\uFEFF/, ""));
  const nameIndex = header.indexOf("卡牌名稱");
  const iconIndex = header.indexOf("卡牌圖示");

  if (nameIndex < 0 || iconIndex < 0) {
    throw new Error("找不到「卡牌名稱」或「卡牌圖示」欄位。");
  }

  for (const row of rows.slice(1)) {
    const icon = iconByName.get(row[nameIndex]);
    if (icon) row[iconIndex] = icon;
  }

  rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  writeFileSync(csvPath, `\uFEFF${serializeCsv(rows)}`);
}

function writeIcons() {
  if (!existsSync(iconDir)) mkdirSync(iconDir, { recursive: true });

  locations.forEach(([name, id, label], index) => {
    writeFileSync(resolve(iconDir, `${id}.svg`), svgFor(label, index));
  });
}

writeIcons();
updateCsv();

console.log(`已更新 ${locations.length} 張場地卡圖示。`);
