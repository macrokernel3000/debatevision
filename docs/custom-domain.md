# 辯語視界子網域接線

## 狀態：2026-09-17，正式上線完成

- 正式入口：https://debatevision.kerneldebate.com/（自動進入 /website/）。
- 原 GitHub Pages 入口已轉址至新子網域。
- 使用者已於 Squarespace 新增 debatevision CNAME，解析值為 macrokernel3000.github.io。
- 設定分支 setup/debatevision-custom-domain 已 fast-forward 合併 main，發布版本 579c93a；正式發布來源為 main 根目錄。
- GitHub Pages 狀態 built；自訂網域正確，憑證 approved，https_enforced=true。
- 官網 https://kerneldebate.com/ 保留原託管與 DNS，本次未修改官網。
- 瀏覽器工具原本無法啟動，後改用 Playwright CLI 成功完成公開網站實測。Squarespace DNS 由使用者操作完成。

## 正式上線驗證

- HTTPS 新入口自動進入 /website/，網站標題正確。
- 瀏覽器實測異境求生抽卡成功，產生卡牌與 1 筆活動紀錄；沒有載入失敗圖片，console errors/warnings 均為 0。
- 發布完成後重新載入，canonical 與 og:url 均為 https://debatevision.kerneldebate.com/website/。
- 活動頁 /website/activities/item-survival/、/sitemap.xml、/robots.txt 皆 HTTP 200。
- 原 GitHub Pages /debatevision/website/ 轉址後為新子網域 /website/，HTTP 200。
- 官網首頁、/team/、/articles/ 均 HTTP 200，根網域 A 仍為 162.159.143.30、172.66.3.26。
- 範圍限制：本次是網域接線，未重測全部玩法或手機尺寸；Google Search Console 新網址索引尚未提交。

以下接線與回復步驟保留供維護參考，無需重複新增 DNS。

## 費用

既有公開 GitHub 儲存庫沿用免費 GitHub Pages。子網域不需另行購買，也不需 Squarespace 網站訂閱；原 kerneldebate.com 網域仍須依原方案續租。

## 使用者在 Squarespace 的操作

1. 開啟 https://domains.squarespace.com ，使用管理此網域的 Google 帳號登入。
2. 選 kerneldebate.com → DNS → DNS Settings（DNS 設定）。
3. 先保存現有完整 DNS 紀錄；找到 Custom Records（自訂紀錄），按 Add Record。
4. 新增以下一筆；若已存在同名紀錄，先停止並確認用途，不要覆蓋。

| 欄位 | 填入 |
| --- | --- |
| Host／主機 | debatevision |
| Type／類型 | CNAME |
| Data／Alias／指向 | macrokernel3000.github.io |
| TTL | 保留預設 |

值不加 https://、斜線或 /debatevision。後台會自動補上 kerneldebate.com。
保存後通知維護者完成 GitHub 切換。DNS 生效可能需數小時，官方說明最長可到 24 小時。DNS 剛加入而 GitHub 尚未切換時，新入口可能出現 404，屬未完成接線，原官網不受影響。

## 官網保護範圍

不改 @、www、nameserver、MX 或既有 TXT。2026-09-17 查詢官網 A 為 162.159.143.30 與 172.66.3.26，僅作比較基準，不是完整 DNS 備份。
只處理 debatevision 子網域，不把 kerneldebate.com 本身填進此專案的 Custom domain。

## 維護者完成發布

1. 確認權威 DNS 的 debatevision CNAME 指向 macrokernel3000.github.io。
2. 再次確認 main 沒有其他人的新修改，審查並合併 setup/debatevision-custom-domain；推送 main。
3. 在 https://github.com/macrokernel3000/debatevision/settings/pages 檢查 Custom domain 為 debatevision.kerneldebate.com；若尚未設定，填入並 Save。僅放 CNAME 檔案不能取代檢查 Pages 後台設定。
4. 等 GitHub DNS check 與憑證核發完成，勾選 Enforce HTTPS；憑證尚未就緒時先等待，不更改官網 DNS。
5. 驗證新入口轉入 /website/，首頁、活動頁、抽卡、圖片、sitemap.xml 與 robots.txt 正常；確認原 GitHub Pages 路徑的轉址。
6. 再驗證 https://kerneldebate.com/、/team/、/articles/ 正常，並更新此文件為實際結果。
7. HTTPS 與網站驗證完成後，再依 Google_Search_Checklist.md 提交新 sitemap。

## 失敗與回復

- 找不到 DNS 頁面：確認登入的是擁有 kerneldebate.com 的帳號；不要購買新網域或網站方案。
- CNAME 尚未查得到：檢查主機只填 debatevision，指向只填 macrokernel3000.github.io，並等待 DNS 快取更新。
- DNS 正確但新網址 404：檢查 GitHub Pages Custom domain、main 的 CNAME 與發布狀態。
- 憑證尚未生成：等待 GitHub 處理，檢查 Pages 錯誤；不要關閉瀏覽器憑證驗證。
- 若需取消尚未完成的接線：先刪除此次新增的 debatevision DNS 紀錄，再清除 GitHub Pages Custom domain；保留官網紀錄。
- 若已發布而需回復：依上述順序解除接線，再用 git revert 回復本次合併的變更並發布，避免 force push；確認原 GitHub Pages 網址恢復正常。

## 官方參考

- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://support.squarespace.com/hc/en-us/articles/31119879125645-DNS-records-for-web-hosting
## 接線前準備驗證（歷史紀錄）

- node scripts/build-seo.mjs：首頁與八個活動頁產生成功。
- node scripts/build-seo.mjs --check：產物一致。
- node --check scripts/build-seo.mjs 與 git diff --check：通過。
- 在首頁、活動頁、產生器、robots 與 sitemap 搜尋舊完整網站網址：零匹配。
- 補齊產生器對首頁 og:url 的同步，避免未來重建時漏更新分享網址。
- 2026-09-17 HTTPS HEAD：官網首頁、/team/、/articles/，以及原辯語視界首頁均為 200。
- 接線前未驗證新網域 HTTPS 與瀏覽器互動；現已完成，結果見上方正式上線驗證。
- Terra 唯讀 QA：網域與官網隔離設定正確；指出 robots 舊路徑殘留，已改為 Allow: /，並統一使用根目錄 sitemap。
