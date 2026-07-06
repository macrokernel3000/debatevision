import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const worldIconLabels = new Map([
  ["殭屍末日", ["world_icon_zombie", "屍"]],
  ["神秘星球", ["world_icon_mystery_planet", "星"]],
  ["遠古叢林", ["world_icon_jungle", "林"]],
  ["炙熱沙漠", ["world_icon_desert", "沙"]],
  ["無人島", ["world_icon_island", "島"]],
  ["極地冰原", ["world_icon_ice", "冰"]],
  ["地下洞穴", ["world_icon_cave", "洞"]],
  ["廢棄醫院", ["world_icon_hospital", "醫"]],
  ["暴雨山區", ["world_icon_rain_mountain", "雨"]],
  ["太空船", ["world_icon_spaceship", "船"]],
  ["海底基地", ["world_icon_undersea_base", "海"]],
  ["火山邊緣", ["world_icon_volcano", "火"]],
  ["中世紀城堡", ["world_icon_castle", "城"]],
  ["未來都市", ["world_icon_future_city", "都"]],
  ["巨型迷宮", ["world_icon_maze", "迷"]],
  ["鬧鬼校園", ["world_icon_haunted_school", "鬼"]],
  ["古代戰場", ["world_icon_battlefield", "戰"]],
  ["豪華郵輪", ["world_icon_cruise", "郵"]],
  ["雲端城市", ["world_icon_cloud_city", "雲"]],
  ["失控實驗室", ["world_icon_lab", "實"]],
  ["漂流木筏", ["world_icon_raft", "筏"]]
]);

const salesIconLabels = new Map([
  ["相冊", ["item_相冊", "冊"]], ["戒指", ["item_戒指", "戒"]], ["鉛筆", ["item_鉛筆", "鉛"]],
  ["皮衣", ["item_皮衣", "衣"]], ["香水", ["item_香水", "香"]], ["咖啡杯", ["item_咖啡杯", "杯"]],
  ["項鍊", ["item_項鍊", "鍊"]], ["帆布袋", ["item_帆布袋", "袋"]], ["太陽眼鏡", ["item_太陽眼鏡", "鏡"]],
  ["絨毛玩具", ["item_絨毛玩具", "玩"]], ["旅行枕", ["item_旅行枕", "枕"]], ["陶瓷碗", ["item_陶瓷碗", "碗"]],
  ["木梳", ["item_木梳", "梳"]], ["鑰匙圈", ["item_鑰匙圈", "鑰"]], ["明信片", ["item_明信片", "信"]],
  ["圍巾", ["item_圍巾", "巾"]], ["電動牙刷", ["item_電動牙刷", "牙"]], ["桌曆", ["item_桌曆", "曆"]],
  ["花瓶", ["item_花瓶", "瓶"]], ["盆栽", ["item_盆栽", "栽"]], ["便當盒", ["item_便當盒", "盒"]],
  ["保溫杯", ["item_保溫杯", "溫"]], ["皮夾", ["item_皮夾", "夾"]], ["名片夾", ["item_名片夾", "名"]],
  ["手工皂", ["item_手工皂", "皂"]], ["髮夾", ["item_髮夾", "髮"]], ["帽T", ["item_帽T", "帽"]],
  ["球鞋", ["item_球鞋", "鞋"]], ["桌燈", ["item_桌燈", "燈"]], ["靠枕", ["item_靠枕", "靠"]],
  ["拼圖", ["item_拼圖", "拼"]], ["棋盤", ["item_棋盤", "棋"]], ["茶包", ["item_茶包", "茶"]],
  ["果醬", ["item_果醬", "醬"]], ["巧克力", ["item_巧克力", "巧"]], ["餅乾禮盒", ["item_餅乾禮盒", "禮"]],
  ["貼紙包", ["item_貼紙包", "貼"]], ["手帳", ["item_手帳", "帳"]], ["鋼筆", ["item_鋼筆", "筆"]],
  ["畫框", ["item_畫框", "框"]], ["唱片", ["item_唱片", "唱"]], ["耳機", ["item_耳機", "耳"]],
  ["行李箱", ["item_行李箱", "箱"]], ["鬧鐘", ["item_鬧鐘", "鐘"]], ["毛毯", ["item_毛毯", "毯"]],
  ["餐墊", ["item_餐墊", "墊"]], ["皮革筆袋", ["item_皮革筆袋", "筆"]], ["香氛卡片", ["item_香氛卡片", "氛"]],
  ["折疊購物袋", ["item_折疊購物袋", "購"]], ["金屬書籤", ["item_金屬書籤", "籤"]]
]);

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

function formatCell(cell) {
  const value = String(cell ?? "");
  if (/[",\r\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

function serializeCsv(rows) {
  return `${rows.map((row) => row.map(formatCell).join(",")).join("\r\n")}\r\n`;
}

function indexes(headers) {
  const cleanHeaders = headers.map((cell) => cell.replace(/^\uFEFF/, ""));
  return {
    name: cleanHeaders.indexOf("卡牌名稱"),
    icon: cleanHeaders.indexOf("卡牌圖示"),
    image: cleanHeaders.indexOf("圖片"),
    rarity: cleanHeaders.indexOf("稀有度")
  };
}

function iconSvg(label, tone = "item") {
  const isWorld = tone === "world";
  const primary = isWorld ? "#5d4bb0" : "#c9901f";
  const accent = isWorld ? "#117a73" : "#171717";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88" role="img" aria-label="${label} icon">
  <rect width="88" height="88" rx="18" fill="#f7efe1"/>
  <rect x="7" y="7" width="74" height="74" rx="15" fill="#fffaf0" stroke="#2b2b2b" stroke-width="3"/>
  <circle cx="44" cy="42" r="25" fill="${primary}" opacity="0.16"/>
  <path d="M23 62h42M29 68h30" fill="none" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>
  <path d="M26 27c8-8 28-8 36 0M30 21c7-5 21-5 28 0" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" opacity="0.72"/>
  <text x="44" y="54" text-anchor="middle" font-family="Arial, 'PingFang TC', 'Noto Sans TC', sans-serif" font-size="28" font-weight="900" fill="#171717">${label}</text>
</svg>
`;
}

function writeIconSet(deckId, entries, tone) {
  const dir = resolve(root, "assets", "icons", deckId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const [, [id, label]] of entries) {
    writeFileSync(resolve(dir, `${id}.svg`), iconSvg(label, tone), "utf8");
  }
}

function updateWorlds() {
  const csvPath = resolve(root, "data", "cards", "異境卡.csv");
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const index = indexes(rows[0]);

  for (const row of rows.slice(1)) {
    const entry = worldIconLabels.get(row[index.name]);
    if (!entry) continue;
    const oldIcon = (row[index.icon] || "").trim();
    if (!row[index.image] && oldIcon && !oldIcon.startsWith("world_icon_")) {
      row[index.image] = oldIcon;
    }
    row[index.icon] = entry[0];
  }

  rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  writeFileSync(csvPath, `\uFEFF${serializeCsv(rows)}`, "utf8");
}

function updateSalesItems() {
  const csvPath = resolve(root, "data", "cards", "物品卡.csv");
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  const index = indexes(rows[0]);

  for (const row of rows.slice(1)) {
    if (row[index.rarity] !== "N") continue;
    const entry = salesIconLabels.get(row[index.name]);
    if (entry) row[index.icon] = entry[0];
  }

  rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
  writeFileSync(csvPath, serializeCsv(rows), "utf8");
}

writeIconSet("worlds", worldIconLabels, "world");
writeIconSet("items", salesIconLabels, "item");
updateWorlds();
updateSalesItems();

console.log(`已整理 ${worldIconLabels.size} 張異境小圖示，${salesIconLabels.size} 張銷售物品小圖示。`);
