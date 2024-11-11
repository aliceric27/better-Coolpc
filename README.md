## 資料來源 

[Coolpc](https://www.coolpc.com.tw/evaluate.php)

## 開放 API

ApiURL = https://pcbuybuy-api.aliceric27.workers.dev

GET：
- /main 從原站點拿資料 (text/html)
- /updatetime 取得網頁更新時間
- /getDatafromKV 從 KV 快取拿資料 (JSON)

POST：
- /updatetime 更新時間
- /setDataToKV 將資料上傳到 KV 快取

## 使用技術

- 使用 Cloudflare Workers 取得資料
- 前端 Dom Parser 手工解析整理資料
- 使用 Vue 3 渲染畫面
- 使用 Element Plus 美化畫面


