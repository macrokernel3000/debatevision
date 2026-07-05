import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = resolve(root, "data", "cards", "物品卡.csv");

const salesCards = [
  ["相冊", "收藏回憶、整理人生片段，適合賣給重視紀念感或家庭關係的人。"],
  ["戒指", "象徵承諾、身份與品味，真正販售的是意義而不只是金屬。"],
  ["鉛筆", "便宜、可修改、低壓力，適合包裝成創作與練習的起點。"],
  ["皮衣", "強烈風格與保護感並存，能賣給想展現態度的人。"],
  ["香水", "把氣味變成記憶與自我形象，適合主打場合、魅力與辨識度。"],
  ["手錶", "提醒時間也展示品味，可以賣給重視效率與形象的人。"],
  ["咖啡杯", "日常陪伴感很強，適合包裝成工作儀式或送禮選擇。"],
  ["項鍊", "接近心口的飾品，適合主打紀念、祝福與個人風格。"],
  ["帆布袋", "輕便、環保、可印圖案，能賣給學生、通勤者與品牌支持者。"],
  ["太陽眼鏡", "遮陽之外也是造型，適合賣給在意照片與外出形象的人。"],
  ["絨毛玩具", "提供陪伴與安慰，適合兒童、粉絲或需要情緒支持的人。"],
  ["筆記本", "承載計畫、靈感與自我管理，適合賣給學生與創作者。"],
  ["旅行枕", "解決移動中的疲勞，適合賣給通勤族、旅人與出差者。"],
  ["蠟燭", "營造氣氛、氣味與放鬆感，適合主打居家儀式。"],
  ["陶瓷碗", "日常吃飯工具，也能被包裝成溫度、質感與餐桌美學。"],
  ["木梳", "功能簡單但有自然質感，可賣給重視養護與手感的人。"],
  ["鑰匙圈", "小而常見，適合主打紀念、識別與低門檻送禮。"],
  ["明信片", "把一句話變成可保存的心意，適合觀光、祝福與收藏情境。"],
  ["圍巾", "保暖之外也能搭配造型，適合主打關心與季節禮物。"],
  ["電動牙刷", "把清潔效率與健康感放大，適合賣給懶得仔細刷牙的人。"],
  ["桌曆", "每天都會被看到，適合賣給需要提醒、規劃與品牌曝光的人。"],
  ["花瓶", "不只是容器，而是讓空間有主題，適合賣給佈置愛好者。"],
  ["盆栽", "提供生命感與陪伴，適合賣給想改善桌面或心情的人。"],
  ["便當盒", "控制飲食與節省花費，適合賣給學生、上班族與健身族群。"],
  ["保溫杯", "讓飲品保持溫度，賣點可以是照顧自己與減少外帶浪費。"],
  ["皮夾", "整理金錢與證件，也展示成熟、秩序與個人品味。"],
  ["名片夾", "讓第一印象更正式，適合賣給業務、新鮮人與創業者。"],
  ["手工皂", "清潔之外有香味、成分與手作故事，適合主打天然與送禮。"],
  ["髮夾", "小物能快速改變造型，適合賣給需要方便整理頭髮的人。"],
  ["帽T", "舒適、休閒、有團體識別感，適合班服、社團或品牌周邊。"],
  ["球鞋", "移動、運動與造型三合一，適合主打舒適和自我風格。"],
  ["桌燈", "提供專注與安全感，適合賣給讀書、工作或夜間創作者。"],
  ["靠枕", "改善坐姿與休息感，適合賣給長時間坐著的人。"],
  ["拼圖", "提供挑戰、專注與完成感，適合家庭、情侶與紓壓族群。"],
  ["棋盤", "創造面對面互動，適合賣給家庭、社團與策略遊戲愛好者。"],
  ["茶包", "低成本創造放鬆時刻，適合賣給需要休息儀式的人。"],
  ["果醬", "把普通吐司變成有風味的早餐，適合主打手作與幸福感。"],
  ["巧克力", "快速提供獎勵、安慰與心意，適合節慶與告白情境。"],
  ["餅乾禮盒", "容易分享與送禮，適合主打體面、方便與節慶氣氛。"],
  ["貼紙包", "便宜但能表達個性，適合學生、手帳族與粉絲社群。"],
  ["手帳", "把生活變得有計畫，適合賣給想自律或記錄成長的人。"],
  ["鋼筆", "書寫儀式感強，適合賣給重視質感、簽名與收藏的人。"],
  ["畫框", "讓作品或照片變得正式，適合賣給想保存重要畫面的人。"],
  ["唱片", "賣的是音樂品味與收藏感，適合復古愛好者與粉絲。"],
  ["耳機", "創造私人聲音空間，適合通勤、讀書與需要專注的人。"],
  ["行李箱", "承載移動與旅行期待，適合賣給旅人、學生與出差族。"],
  ["鬧鐘", "把起床變成明確承諾，適合賣給想改善作息的人。"],
  ["毛毯", "提供溫暖與安全感，適合居家、露營與禮物情境。"],
  ["餐墊", "保護桌面也建立餐桌風格，適合賣給重視生活感的人。"],
  ["皮革筆袋", "整理文具並展現質感，適合學生、上班族與手作愛好者。"],
  ["香氛卡片", "小小一張就能改變空間氣味，適合放在衣櫃、書桌或禮物中。"],
  ["折疊購物袋", "把臨時購物變得方便又環保，適合通勤者、市場採買者與旅行者。"],
  ["金屬書籤", "讓閱讀進度變得精緻可保存，適合送給學生、讀者與文具收藏者。"]
];

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

const rows = parseCsv(readFileSync(csvPath, "utf8"));
const header = rows[0].map((cell) => cell.replace(/^\uFEFF/, ""));
const nameIndex = header.indexOf("卡牌名稱");
const existingNames = new Set(rows.slice(1).map((row) => row[nameIndex]));

for (const [name, description] of salesCards) {
  if (existingNames.has(name)) continue;
  rows.push(["items", "物品卡", "□", name, description, "", "", "N", "銷售|N卡"]);
}

rows[0][0] = rows[0][0].replace(/^\uFEFF/, "");
writeFileSync(csvPath, `${serializeCsv(rows)}`, "utf8");

console.log(`已確認 ${salesCards.length} 張 N 卡，新增 ${salesCards.filter(([name]) => !existingNames.has(name)).length} 張。`);
