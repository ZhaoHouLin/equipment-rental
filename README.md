# 設備借用系統

給公司或機關資訊室用的設備借用系統：借用人填單、掃財編條碼、電子簽名；管理員看清單、標記歸還、看逾期、管庫存、看修改紀錄、匯出 Excel。

Nuxt 4 + naive-ui + SQLite（Node 內建 `node:sqlite`，不用裝資料庫伺服器）。管理員登入可用公司 AD（LDAP）或本機帳密。

## 跑起來

```bash
cp .env.example .env     # 填 NUXT_JWT_SECRET 與管理員密碼雜湊
npm install
npm run dev              # http://localhost:3001
```

Node 22.13 以上。

## 環境變數

見 `.env.example`。重點：

| 變數 | 說明 |
|---|---|
| `NUXT_JWT_SECRET` | 必填，缺少時不啟動 |
| `NUXT_AUTH_MODE` | `local` 或 `ldap` |
| `NUXT_ADMIN_USER` / `NUXT_ADMIN_PASSWORD_HASH` | local 模式的管理員 |
| `NUXT_LDAP_URL` / `NUXT_LDAP_DOMAIN` | ldap 模式 |
| `NUXT_DB_PATH` | SQLite 檔案，預設 `data/rental.sqlite` |
| `NUXT_SMTP_HOST` / `NUXT_SMTP_PORT` / `NUXT_MAIL_FROM` | 通知信；不設就不寄 |
| `NUXT_SEED_DEMO` | 設 1 時空資料庫會塞示範品項 |

## API

| 路由 | 權限 | 說明 |
|---|---|---|
| `GET /api/items` | 公開 | 可借品項與剩餘數 |
| `GET /api/settings` | 公開 | 單位清單、信箱網域、掃描規則 |
| `POST /api/rentals` | 公開 | 送出借用單；交易內檢查庫存、寫單、扣庫存，不足回 409 |
| `POST /api/auth/login`、`/logout`、`GET /api/auth/me` | | 管理員登入狀態 |
| `GET /api/rentals?overdue=1&status=` | 管理員 | 借用清單，含逾期旗標 |
| `PUT /api/rentals/:id/return` | 管理員 | 歸還：庫存加回、寄信 |
| `GET /api/rentals/export` | 管理員 | 匯出 Excel |
| `POST /api/admin/items`、`PUT /api/admin/items/:id`、`DELETE /api/admin/items/:id` | 管理員 | 品項新增、修改、停用 |
| `PUT /api/admin/settings` | 管理員 | 設定 |
| `GET /api/admin/audit` | 管理員 | 修改紀錄 |

所有借用、歸還、品項與設定變更都寫進修改紀錄（誰、何時、改了什麼）。

## 部署

- **pm2**：`npm run build` 後 `pm2 start ecosystem.config.js`，`.env` 放同目錄。只跑 1 個 instance。
- **Docker**：`Dockerfile` 就緒，`NUXT_DB_PATH` 指到掛載的 volume。
- **Render 示範**：`render.yaml`，免費方案會休眠、資料不持久。

## 測試

```bash
npm run build
HASH=$(node -e "console.log(require('bcryptjs').hashSync('test-password-123', 10))")
NUXT_JWT_SECRET=x NUXT_ADMIN_PASSWORD_HASH="$HASH" NUXT_SEED_DEMO=1 NUXT_DB_PATH=./tmp/test.sqlite PORT=3095 node .output/server/index.mjs &
node tests/api.e2e.mjs http://localhost:3095
```
