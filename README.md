## 資料來源 

[Coolpc](https://www.coolpc.com.tw/evaluate.php)

## 開放 API

ApiURL = https://pcbuybuy-api.aliceric27.workers.dev

GET：
- /main 從原站點拿資料
- /updatetime 取得網頁更新時間
- /getDatafromKV 從KV快取拿資料

POST：
- /updatetime 更新時間
- /getDatafromKV 更新KV資料

## 使用技術

- 使用 Cloudflare Workers 取得資料
- 前端 Dom Parser 手工解析整理資料
- 使用 Vue 3 渲染畫面
- 使用 Element Plus 美化畫面


