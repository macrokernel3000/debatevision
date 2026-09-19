# 卡片讀取優化（2026-09-19）

## 原因與修正

公開站首次抽卡實測：殭屍末日 PNG 2,221,396 bytes，下載約 9,047ms；保鮮膜 PNG 96,326 bytes，約 1,828ms。此為當次網路觀察，不代表固定速度。

沿用既有 Pillow 工具，新增卡圖與圖示的 WebP 衍生圖。保留全部原圖、像素尺寸、透明度及 CSV。建置時僅在同名 WebP 存在且較小時選用，依實際圖片內容更新快取版本碼；不增加瀏覽器框架或服務。

328 張來源圖片共 274,095,486 bytes；較小衍生圖共 33,021,606 bytes，減少 88.0%。這是整個素材集合，不是首頁每次下載量。

| 圖片 | 原圖 bytes | WebP bytes | 減少 |
| --- | ---: | ---: | ---: |
| 殭屍末日 | 2,221,396 | 155,522 | 93.0% |
| 保鮮膜 | 96,326 | 24,150 | 74.9% |

WebP quality 82 為有損壓縮；代表場景圖已目視核對，完整尺寸保留。PNG 留作日後編修，不會被覆蓋。首次連線延遲仍受 GitHub Pages 與使用者網路影響。

## 以後新增／更換卡圖

在專案根目錄依序執行（Python 需已安裝 Pillow）：

```text
python scripts/optimize-images.py
python scripts/check-optimized-images.py
node scripts/build-lexicons.mjs
node scripts/check-assets.mjs
```

再提交原圖、新增／更新的 WebP、generated 與首頁快取版本。只有上傳原始 PNG，不重跑壓縮與建置，不能保證網站使用最新圖片。圖檔以 .webp.tmp 暫存後替換，降低中斷產生空檔風險。

## 驗證

- 資料契約、generated 一致性、圖片引用與架構檢查通過。
- 328 張壓縮圖全數可解碼、像素尺寸一致、透明度逐像素一致。
- 既有 browser smoke：390、768、1280px 三種尺寸 × 八個活動通過。
- Terra 範圍 QA 檢查建置圖片選擇、相對路徑、內容快取碼及來源保留。
- 線上發布後驗證結果另追加下方。

## 回復

以 git revert 回復本次程式、產物與新增 WebP 的提交，再推送 main 即恢復原圖載入方式。不要刪除原始 PNG，不需要更改 DNS 或官網。
## 正式站驗證

發布版本 3b5a543，GitHub Pages built。正式網站資料已指向 WebP；殭屍末日 WebP 實測 HTTP 200、155,522 bytes、下載 1,901ms（對照同次診斷原 PNG 9,047ms；不同請求時點，僅為觀察值，非固定速度保證）。正式抽卡另抽出叢林與防毒面具，圖片解碼成功，console error/warning 為 0。