# Better-Coolpc 現代化改版

這是 Better-Coolpc 的現代化改版專案，提供了全新的使用者介面和增強功能。

## 🚀 新版本特色

### 視覺設計升級
- **深色模式支援** - 自動偵測系統主題，可手動切換
- **現代化設計語言** - 採用卡片式佈局和柔和配色
- **流暢動畫效果** - 所有交互都有平滑過渡
- **響應式設計** - 完美支援桌面和移動設備

### 功能增強
- **配置管理系統** - 保存、載入多個配置方案
- **一鍵分享** - 生成可分享的配置連結
- **側邊欄預覽** - 即時查看已選配件和總價
- **智慧搜尋** - 快速篩選找到需要的配件

### 技術改進
- **更好的程式碼結構** - 模組化設計，易於維護
- **性能優化** - 虛擬滾動和懶加載
- **無障礙支援** - 符合 WCAG 2.1 標準

## 📁 檔案結構

```
better-Coolpc/
├── index.html          # 原始版本
├── index-modern.html   # 現代化版本
├── preview.html        # 版本選擇頁面
├── style.css          # 原始樣式
├── modern-style.css   # 現代化樣式
├── worker.js          # Cloudflare Workers 後端
└── README.md          # 本文件
```

## 🎯 使用方式

1. **查看預覽頁面**
   ```
   開啟 preview.html 選擇想要使用的版本
   ```

2. **直接訪問**
   - 原始版本: `index.html`
   - 現代化版本: `index-modern.html`

## 🛠️ 技術架構

### 資料來源 
[Coolpc](https://www.coolpc.com.tw/evaluate.php)

### 開放 API
API `https://pcbuybuy.aliceric27.workers.dev`

### 使用技術
- 使用 Cloudflare Workers 取得資料
- 前端 Dom Parser解析整理資料
- 使用 Vue 3 渲染畫面
- 使用 Element Plus 美化畫面

## 💻 開發指南

### 本地開發
```bash
# 使用 Python 啟動本地伺服器
python -m http.server 8000

# 或使用 Node.js
npx serve .
```

### 部署
- 前端：任何靜態網頁託管服務（GitHub Pages、Netlify、Vercel 等）
- 後端：Cloudflare Workers

## 🎨 自訂主題

在 `modern-style.css` 中修改 CSS 變數：

```css
:root {
  --primary-color: #5e72e4;  /* 主色調 */
  --bg-primary: #f8f9fe;      /* 背景色 */
  --text-primary: #32325d;    /* 文字色 */
}
```

## 📱 瀏覽器支援

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- 移動瀏覽器：iOS Safari 14+、Chrome Android

## 🤝 貢獻指南

歡迎提交 Pull Request 或開啟 Issue 討論新功能和改進建議。

## 📄 授權

MIT License


