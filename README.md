# Anthony Portfolio — Frontend

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" /> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" /> <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" /> <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" /> <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" /> <img src="https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" /> <img src="https://img.shields.io/badge/Markdown-000000?style=for-the-badge&logo=markdown&logoColor=white" /> <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=websocket&logoColor=white" />

個人作品集網站的前端應用，採用極簡設計風格，具備作品展示、報價系統、即時聊天、案件管理等功能。

The frontend application for a personal portfolio website with minimalist design, featuring portfolio showcase, quoting system, real-time chat, and case management.

## 功能 Features

- **作品集展示 Portfolio Showcase** — 瀑布流圖片畫廊，Hover 動畫效果 / Masonry image gallery with hover animations
- **服務頁面 Services Page** — 分類展示服務項目與定價 / Categorized service listings with pricing
- **報價表單 Quote Form** — 客戶線上填寫報價需求，支援 Markdown / Online quote request form with Markdown support
- **即時聊天 Real-time Chat** — WebSocket 雙向通訊，支援圖片、報價提案、已讀回執 / WebSocket chat with images, quote offers, and read receipts
- **案件管理 Case Management** — 從聊天室或報價成立案件，結案需密碼驗證 / Create cases from chat or quotes, password-protected closure
- **管理後台 Admin Panel** — 作品集、服務、報價、案件、聊天、關於頁面的完整管理 / Full management of portfolios, services, quotes, cases, chat, and about page
- **自訂游標 Custom Cursor** — 粒子軌跡動畫、互動 hover 效果 / Particle trail animation with interactive hover effects
- **國際化 i18n** — 繁體中文 / English 雙語切換 / Traditional Chinese & English language toggle
- **關於頁面 About Page** — Markdown 編輯器，30 秒自動儲存 / Markdown editor with 30-second auto-save
- **響應式設計 Responsive Design** — 桌面與行動裝置自適應 / Adaptive layout for desktop and mobile

## 技術架構 Tech Stack

| 類別 Category | 技術 Technology |
|---|---|
| 語言 Language | TypeScript |
| 框架 Framework | React 19 |
| 建置工具 Build Tool | Vite |
| 樣式 Styling | Tailwind CSS v4 |
| 動畫 Animation | Framer Motion (motion/react) |
| 路由 Routing | React Router v7 |
| 圖標 Icons | Lucide React |
| Markdown | react-markdown |
| 即時通訊 Real-time | WebSocket |

## 專案結構 Project Structure

```
frontend/
├── index.html
├── src/
│   ├── main.tsx                  # 應用程式入口 / App entry point
│   ├── App.tsx                   # 路由設定 / Route configuration
│   ├── api.ts                    # API 基礎設定 / API base config
│   ├── index.css                 # 全域樣式 / Global styles
│   ├── i18n/
│   │   ├── index.ts              # i18n Hook / i18n hook
│   │   └── locales.ts            # 中英翻譯字串 / zh/en translations
│   ├── components/
│   │   ├── Cursor.tsx            # 自訂游標與粒子效果 / Custom cursor with particles
│   │   ├── Navbar.tsx            # 導覽列 / Navigation bar
│   │   ├── Hero.tsx              # 首頁主視覺 / Hero section
│   │   ├── Gallery.tsx           # 作品集畫廊 / Portfolio gallery
│   │   ├── About.tsx             # 關於區塊 / About section
│   │   ├── Contact.tsx           # 聯絡區塊 / Contact section
│   │   ├── AdminChat.tsx         # 管理員聊天面板 / Admin chat panel
│   │   ├── AdminCases.tsx        # 案件管理元件 / Case management component
│   │   ├── MarkdownEditor.tsx    # Markdown 編輯器 / Markdown editor
│   │   ├── MarkdownToolbar.tsx   # Markdown 工具列 / Markdown toolbar
│   │   ├── TagSelector.tsx       # 標籤選擇器 / Tag selector
│   │   ├── CategorySelector.tsx  # 分類選擇器 / Category selector
│   │   └── Toast.tsx             # 通知元件 / Toast notifications
│   └── pages/
│       ├── HomePage.tsx          # 首頁 / Home page
│       ├── ServicesPage.tsx      # 服務頁面 / Services page
│       ├── QuotePage.tsx         # 報價頁面 / Quote page
│       ├── ChatPage.tsx          # 聊天頁面 / Chat page
│       ├── AboutPage.tsx         # 關於頁面 / About page
│       ├── AdminPage.tsx         # 管理後台 / Admin dashboard
│       └── LoginPage.tsx         # 登入頁面 / Login page
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Makefile
├── .env.example
└── .gitignore
```

## 快速開始 Getting Started

```bash
# 安裝依賴 Install dependencies
npm install

# 複製環境變數 Copy environment variables
cp .env.example .env
# 編輯 .env 填入實際值 Edit .env with actual values

# 啟動開發伺服器 Start dev server
npm run dev
# 或 or
make dev
```

## 環境變數 Environment Variables

參考 `.env.example` 設定以下變數 / Refer to `.env.example` for the following variables:

| 變數 Variable | 說明 Description |
|---|---|
| `VITE_API_BASE` | 後端 API 網址 / Backend API URL |

## 授權 License

© 2026 Anthony Sung. All rights reserved.
