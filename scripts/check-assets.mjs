import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const checked = new Set();
const modeImageStems = new Set();

function relative(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function checkAsset(reference, source) {
  const cleaned = reference.replace(/[?#].*$/, "");
  if (!cleaned.startsWith("../assets/")) return;
  const assetPath = path.join(root, cleaned.slice(3));
  const key = `${relative(assetPath)}\u0000${source}`;
  if (checked.has(key)) return;
  checked.add(key);
  if (!fs.existsSync(assetPath)) failures.push(`${source} 引用不存在的 ${relative(assetPath)}`);
  const modeImage = cleaned.match(/^\.\.\/assets\/backgrounds\/modes\/([^/]+)\.(?:png|webp|jpe?g)$/i);
  if (modeImage) modeImageStems.add(modeImage[1]);
}

function scanFile(relativePath) {
  const source = fs.readFileSync(path.join(root, relativePath), "utf8");
  const references = source.match(/\.\.\/assets\/[\p{L}\p{N}_@%+.,()\-\/]+\.(?:png|webp|jpe?g|svg|gif)/giu) || [];
  for (const reference of references) checkAsset(reference, relativePath);
}

function walk(relativeDirectory, extensions) {
  const directory = path.join(root, relativeDirectory);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) walk(relativePath, extensions);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) scanFile(relativePath);
  }
}

walk("data", new Set([".csv", ".json", ".js"]));
walk("website", new Set([".html", ".css", ".js"]));

const modesDirectory = path.join(root, "data/modes");
for (const stem of modeImageStems) {
  for (const variant of ["thumb", "banner"]) {
    checkAsset(`../assets/backgrounds/modes/mobile/${stem}-${variant}.webp`, `${stem} 的手機圖`);
  }
}

if (failures.length) {
  console.error("資產檢查失敗：\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`資產檢查通過：${checked.size} 個來源與衍生圖片引用都存在。`);
