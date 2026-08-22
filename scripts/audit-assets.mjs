import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const assetsRoot = join(root, "assets");
const outputPath = join(root, "outputs", "asset-audit.md");
const sourceRoots = ["data/cards", "data/content", "data/modes", "data/image-layouts", "website", "docs"];
const textExtensions = new Set([".csv", ".json", ".js", ".css", ".html", ".md"]);
const assetExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"]);

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}

const sourceFiles = (await Promise.all(sourceRoots.map(async (path) => {
  try { return await files(join(root, path)); } catch { return []; }
}))).flat().filter((path) => textExtensions.has(extname(path).toLowerCase()));
const sourceText = (await Promise.all(sourceFiles.map((path) => readFile(path, "utf8")))).join("\n");
const assetFiles = (await files(assetsRoot)).filter((path) => assetExtensions.has(extname(path).toLowerCase()));
const records = await Promise.all(assetFiles.map(async (path) => {
  const info = await stat(path);
  const relativePath = relative(root, path);
  const name = basename(path);
  const referenced = sourceText.includes(relativePath) || sourceText.includes(relativePath.replace(/^assets\//, "")) || sourceText.includes(name);
  const sourceLike = /original|source|候選|checkerboard|backup|備份|舊版/i.test(relativePath);
  return { path: relativePath, size: info.size, referenced, sourceLike };
}));

const totalSize = records.reduce((sum, item) => sum + item.size, 0);
const candidates = records.filter((item) => !item.referenced).sort((a, b) => b.size - a.size);
const large = records.filter((item) => item.size >= 1024 * 1024).sort((a, b) => b.size - a.size);
const sourceLike = records.filter((item) => item.sourceLike).sort((a, b) => b.size - a.size);
const size = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const rows = (items, limit = 100) => items.slice(0, limit).map((item) => `| \`${item.path}\` | ${size(item.size)} |`).join("\n") || "| 無 | 0 MB |";

const report = `# 圖片資產盤點

產生日期：${new Date().toISOString().slice(0, 10)}

> 「未引用候選」採檔名與路徑文字比對，可能包含由程式規則間接使用的圖片；刪除前仍須人工確認。

## 摘要

- 圖片檔案：${records.length}
- 總容量：${size(totalSize)}
- 1 MB 以上：${large.length}
- 未引用候選：${candidates.length}（${size(candidates.reduce((sum, item) => sum + item.size, 0))}）
- 疑似原始／候選／備份來源：${sourceLike.length}

## 未引用候選（依容量）

| 路徑 | 容量 |
| --- | ---: |
${rows(candidates)}

## 1 MB 以上圖片

| 路徑 | 容量 |
| --- | ---: |
${rows(large)}

## 疑似製作來源

| 路徑 | 容量 |
| --- | ---: |
${rows(sourceLike)}
`;

await mkdir(join(root, "outputs"), { recursive: true });
await writeFile(outputPath, report, "utf8");
console.log(`資產盤點完成：${records.length} 張圖片，${candidates.length} 個未引用候選。`);
console.log(outputPath);
