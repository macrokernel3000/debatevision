# Google Search Checklist

這份文件用來檢查 DebateVision / 辯語視界是否具備被 Google 搜尋收錄的基本條件。

## 接線完成後的網站網址（狀態見 custom-domain.md）

```text
https://debatevision.kerneldebate.com/website/
```

## 已在專案內處理的條件

- 首頁有明確標題：`辯語視界 DebateVision｜思辨教育活動抽卡工具`
- 首頁有搜尋描述：說明這是思辨教育、辯論暖身、口語表達用的抽卡活動網站
- 首頁允許搜尋引擎索引：`robots` 設為 `index, follow`
- 首頁有 canonical：指向正式自訂網域網址
- 首頁有 Open Graph 分享資訊
- 首頁有 JSON-LD 結構化資料
- 根目錄有 `sitemap.xml`
- 根目錄有 `robots.txt`

## 上線後要做的事

1. 確認 GitHub Pages 可以公開開啟：

```text
https://debatevision.kerneldebate.com/website/
```

2. 到 Google Search Console：

```text
https://search.google.com/search-console
```

3. 新增網址前置字元資源：

```text
https://debatevision.kerneldebate.com/
```

4. 依 Google 指示完成驗證。

如果 Google 給的是 HTML 驗證檔，請把檔案放在專案根目錄後重新上傳 GitHub。

如果 Google 給的是 meta tag，請加到：

```text
website/index.html
```

5. 在 Search Console 提交 sitemap：

```text
https://debatevision.kerneldebate.com/sitemap.xml
```

6. 用「網址檢查」輸入：

```text
https://debatevision.kerneldebate.com/website/
```

然後按「要求建立索引」。

7. 等待 Google 爬取。第一次收錄可能需要數天到數週。

## 檢查是否被收錄

可以在 Google 搜尋：

```text
site:debatevision.kerneldebate.com
```

如果還沒有結果，不代表失敗，通常只是 Google 尚未爬取或尚未建立索引。

## GitHub Pages 注意事項

接線完成後，網站使用 debatevision.kerneldebate.com；根目錄的 robots.txt 與 sitemap.xml 可直接由此子網域讀取。GitHub 繼續負責程式版本與靜態託管。

## 之後改網站時

每次更新正式版後，請檢查：

- `website/index.html` 的 title 與 description 是否仍符合網站內容
- `sitemap.xml` 的網址是否正確
- GitHub Pages 是否能正常開啟
- Search Console 是否有新的錯誤
