import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "data/content/SEO設定.csv");
const modesPath = path.join(root, "data/generated/modes.js");
const websiteIndexPath = path.join(root, "website/index.html");
const rootIndexPath = path.join(root, "index.html");
const sitemapPath = path.join(root, "sitemap.xml");
const activitiesDir = path.join(root, "website/activities");
const checkOnly = process.argv.includes("--check");
const siteRoot = "https://macrokernel3000.github.io/debatevision";
const appUrl = `${siteRoot}/website/`;

const headers = {
  "頁面ID": "id", "網址代號": "slug", "允許索引": "index",
  "搜尋標題": "title", "搜尋摘要": "description", "頁面主標題": "h1",
  "主要關鍵詞": "primaryKeyword", "次要關鍵詞": "secondaryKeywords",
  "分享圖片": "image", "頁面介紹": "intro"
};

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index], next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(cell); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; continue;
    }
    cell += char;
  }
  if (cell || row.length) { row.push(cell); if (row.some(Boolean)) rows.push(row); }
  const keys = (rows.shift() || []).map((header) => headers[header.trim()] || header.trim());
  return rows.map((values) => Object.fromEntries(keys.map((key, index) => [key, (values[index] || "").trim()])));
}

function readModes() {
  const source = fs.readFileSync(modesPath, "utf8").trim();
  const json = source.replace(/^window\.DEBATE_MODES\s*=\s*/, "").replace(/;$/, "");
  return JSON.parse(json);
}

function escapeHtml(value) {
  return String(value || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function plainImage(reference) {
  return String(reference || "").replace(/[?#].*$/, "");
}

function absoluteImage(reference) {
  const clean = plainImage(reference);
  if (/^https?:\/\//.test(clean)) return clean;
  if (clean.startsWith("../assets/")) return `${siteRoot}/${clean.slice(3)}`;
  if (clean.startsWith("assets/")) return `${siteRoot}/${clean}`;
  return `${siteRoot}/assets/ui/logo/debatevision-logo-source.png`;
}

function activityImage(reference) {
  const clean = plainImage(reference);
  if (clean.startsWith("../assets/")) return `../../../${clean.slice(3)}`;
  if (clean.startsWith("assets/")) return `../../../${clean}`;
  return clean;
}

function replaceRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`找不到 ${label}，無法更新 SEO`);
  return source.replace(pattern, replacement);
}

function updateHomepage(source, seo, full = true) {
  let html = replaceRequired(source, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(seo.title)}</title>`, "title");
  html = replaceRequired(html, /<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`, "description");
  html = replaceRequired(html, /<link\s+rel="canonical"[^>]*\/>/, `<link rel="canonical" href="${appUrl}" />`, "canonical");
  if (!full) return html;
  html = replaceRequired(html, /<meta\s+property="og:title"[^>]*\/>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`, "og:title");
  html = replaceRequired(html, /<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`, "og:description");
  html = replaceRequired(html, /<meta\s+property="og:image"[^>]*\/>/, `<meta property="og:image" content="${escapeHtml(absoluteImage(seo.image))}" />`, "og:image");
  const structured = {
    "@context": "https://schema.org", "@type": "WebApplication",
    name: "辯語視界 DebateVision", url: appUrl, description: seo.description,
    inLanguage: "zh-Hant", applicationCategory: "EducationalApplication", operatingSystem: "Any"
  };
  html = replaceRequired(html, /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">\n${JSON.stringify(structured, null, 8)}\n    </script>`, "結構化資料");
  return html;
}

function modePage(mode, seo, allPages) {
  const canonical = `${appUrl}activities/${seo.slug}/`;
  const image = seo.image || mode.image;
  const tags = [seo.primaryKeyword, ...seo.secondaryKeywords.split("|")].filter(Boolean);
  const flow = (mode.flow || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n");
  const prompts = (mode.prompts || []).map(([title, content]) => `<li><strong>${escapeHtml(title)}</strong>：${escapeHtml(content)}</li>`).join("\n");
  const more = allPages.filter((page) => page.id !== mode.id).map((page) => `<a href="../${escapeHtml(page.slug)}/">${escapeHtml(page.h1)}</a>`).join("\n");
  const structured = {
    "@context": "https://schema.org", "@type": "LearningResource",
    name: seo.h1, description: seo.description, url: canonical, image: absoluteImage(image),
    inLanguage: "zh-Hant", educationalUse: "課堂活動", isAccessibleForFree: true,
    isPartOf: { "@type": "WebSite", name: "辯語視界 DebateVision", url: appUrl }
  };
  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(seo.title)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <meta name="robots" content="${seo.index === "是" ? "index, follow" : "noindex, nofollow"}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(seo.title)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${escapeHtml(absoluteImage(image))}" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/png" href="../../../assets/ui/logo/debatevision-logo.png" />
    <script type="application/ld+json">${JSON.stringify(structured)}</script>
    <link rel="stylesheet" href="../../styles/seo-landing.css" />
  </head>
  <body>
    <nav class="seo-shell seo-nav" aria-label="主要導覽">
      <a class="seo-brand" href="../../">辯語視界 DebateVision</a>
      <div class="seo-nav-links"><a href="../../">所有活動</a><a href="../../?mode=${mode.id}">開啟工具</a></div>
    </nav>
    <main class="seo-shell">
      <header class="seo-hero" style="--hero-image:url('${escapeHtml(activityImage(image))}')">
        <div><p class="seo-kicker">${escapeHtml(seo.primaryKeyword)} · ${escapeHtml(mode.track)}</p><h1>${escapeHtml(seo.h1)}</h1><p class="seo-lead">${escapeHtml(seo.intro)}</p>
          <div class="seo-actions"><a class="seo-button" href="../../?mode=${mode.id}">開始「${escapeHtml(mode.title)}」</a><a class="seo-button secondary" href="#玩法">查看玩法</a></div>
        </div>
      </header>
      <div class="seo-content" id="玩法">
        <article class="seo-card"><h2>這個活動怎麼進行？</h2><p>${escapeHtml(mode.description)}</p><ol class="seo-list">${flow}</ol></article>
        <aside class="seo-card"><h2>適合練習</h2>${prompts ? `<ul class="seo-list">${prompts}</ul>` : `<p>輸入課堂內容後即可投影使用，並可搭配內建計時器進行活動。</p>`}<div class="seo-tags">${tags.map((tag) => `<span class="seo-tag">${escapeHtml(tag)}</span>`).join("")}</div></aside>
      </div>
      <section class="seo-more"><h2>更多思辨活動</h2><div class="seo-more-grid">${more}</div></section>
    </main>
    <footer class="seo-footer"><div class="seo-shell">辯語視界 DebateVision｜給老師與教練使用的思辨教育活動工具</div></footer>
  </body>
</html>\n`;
}

function sitemap(pages) {
  const sourceModifiedAt = Math.max(fs.statSync(configPath).mtimeMs, fs.statSync(modesPath).mtimeMs);
  const today = new Date(sourceModifiedAt).toISOString().slice(0, 10);
  const urls = [{ loc: appUrl, priority: "1.0" }, ...pages.filter((page) => page.index === "是").map((page) => ({ loc: `${appUrl}activities/${page.slug}/`, priority: "0.8" }))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ loc, priority }) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
}

function validate(rows, modes) {
  const issues = [];
  const homepage = rows.find((row) => row.id === "home");
  if (!homepage) issues.push("缺少 home 首頁設定");
  const pages = rows.filter((row) => row.id !== "home");
  const modeIds = new Set(modes.map((mode) => mode.id));
  for (const mode of modes) if (!pages.some((page) => page.id === mode.id)) issues.push(`缺少 ${mode.title} 的 SEO 設定`);
  for (const page of pages) {
    if (!modeIds.has(page.id)) issues.push(`SEO設定.csv 有不存在的活動：${page.id}`);
    for (const field of ["slug", "title", "description", "h1", "primaryKeyword", "intro"]) if (!page[field]) issues.push(`${page.id} 缺少 ${field}`);
    if (page.primaryKeyword && !`${page.title}${page.h1}${page.intro}`.includes(page.primaryKeyword)) issues.push(`${page.id} 的主要關鍵詞未出現在標題或介紹`);
  }
  for (const field of ["slug", "title"]) {
    const values = pages.map((page) => page[field]);
    if (new Set(values).size !== values.length) issues.push(`${field} 有重複值`);
  }
  return { homepage, pages, issues };
}

function compareOrWrite(filePath, content, stale) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (current === content) return;
  if (checkOnly) stale.push(path.relative(root, filePath));
  else { fs.mkdirSync(path.dirname(filePath), { recursive: true }); fs.writeFileSync(filePath, content, "utf8"); }
}

const rows = parseCsv(fs.readFileSync(configPath, "utf8"));
const modes = readModes();
const { homepage, pages, issues } = validate(rows, modes);
if (issues.length) { console.error(`SEO 設定檢查失敗：\n- ${issues.join("\n- ")}`); process.exit(1); }
const stale = [];
const pageMap = new Map(pages.map((page) => [page.id, page]));
for (const mode of modes) compareOrWrite(path.join(activitiesDir, pageMap.get(mode.id).slug, "index.html"), modePage(mode, pageMap.get(mode.id), pages), stale);
compareOrWrite(websiteIndexPath, updateHomepage(fs.readFileSync(websiteIndexPath, "utf8"), homepage), stale);
compareOrWrite(rootIndexPath, updateHomepage(fs.readFileSync(rootIndexPath, "utf8"), homepage, false), stale);
compareOrWrite(sitemapPath, sitemap(pages), stale);
if (stale.length) { console.error(`SEO 產物尚未更新：${stale.join("、")}。請執行 node scripts/build-seo.mjs`); process.exit(1); }
console.log(checkOnly ? `SEO 設定與 ${pages.length} 個活動頁一致。` : `已更新首頁 SEO、sitemap 與 ${pages.length} 個獨立活動頁。`);
