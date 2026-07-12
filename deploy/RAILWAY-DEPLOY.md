# Railway 免费后端部署指南（推荐：不休眠）

> 适用场景：想**零/极低成本**把后端跑在公网，且**不愿接受 Render 的 15 分钟休眠 + 冷启动 30s+**。
> Railway 用 **$5/月 额度制**（非永久免费，但低频 MVP 基本花不到 $5，等同免费），**服务不休眠、冷启动快、自带 HTTPS 域名**，
> 比 Render 更适合给真实早期用户用。
> 前端仍用 **Vercel**（免费），数据库用 **Supabase**（免费 500MB）。业务代码**零改动**。

---

## 一、平台组合与额度

| 层 | 平台 | 费用 | 关键特性 |
|----|------|------|---------|
| 前端静态 | Vercel | 免费 | 自动 HTTPS、rewrite 代理 `/api` |
| 后端服务 | **Railway** | **$5/月额度**（用完停服或付费；不休眠） | Nixpacks 自动构建、`.up.railway.app` 域名、健康检查 |
| 数据库 | Supabase | 免费 500MB | PostgreSQL + 控制台 |

> 额度说明：Railway 给每个项目每月 $5 计算额度。1 个 512MB–1GB 实例跑满整月约 $3–5。
> 若担心超额度，可在 Railway 控制台设 **usage limits**（到 $5 自动暂停）。MVP 验证期通常触不到上限。

---

## 二、步骤 1 ｜ 数据库 Supabase（与 Render 方案相同）

1. 注册 https://supabase.com → New Project（地区选 Tokyo / Singapore，离国内近）。
2. **Project Settings → Database → Connection string** 复制 URI：
   `postgresql://postgres:<密码>@db.<项目ID>.supabase.co:5432/postgres`
3. 迁移本地 604 行种子（本地需 `pg_dump`）：
   ```bash
   pg_dump -Fc -h localhost -p 5432 -U gaokao gaokao > /tmp/gaokao.dump
   pg_restore -h db.<项目ID>.supabase.co -p 5432 -U postgres -d postgres \
     --no-owner --clean --if-exists /tmp/gaokao.dump
   ```
4. SQL Editor 跑 `SELECT count(*) FROM <你的表>;` 确认 7 张表 + 604 行到位。

---

## 三、步骤 2 ｜ 后端 Railway

> 已生成 `deploy/railway.json`（rootDirectory=backend、nixpacks 构建、healthcheck=/health、失败重启）。

**方式 A（推荐，自动识别）**：把 `deploy/railway.json` 复制到**仓库根目录**命名为 `railway.json`，然后：
1. 注册 https://railway.app → New Project → Deploy from GitHub repo。
2. Railway 读到根目录 `railway.json` → 自动用 Nixpacks 构建 `backend`（rootDirectory 已指定）。
3. 在 Railway 项目 → **Variables** 添加：
   - `DATABASE_URL` = Supabase 连接串
   - `DEEPSEEK_API_KEY` = 真实 DeepSeek 密钥
   - `DEEPSEEK_BASE_URL` = `https://api.deepseek.com`
   - `DEEPSEEK_MODEL` = `deepseek-v4-flash`
   - `LLM_TIMEOUT` = `60000`
   - `NODE_ENV` = `production`
   - `PORT` = `8080`（Railway 也会注入自己的 `$PORT`，代码若监听 `process.env.PORT` 即可，详见下方「端口注意」）
4. Deploy → 在 **Settings → Domains** 生成 `https://<项目名>.up.railway.app`。
   （也可在 Variables 里绑自定义域名。）

**方式 B（手动）**：New Project → Empty Project → 手动加 Service 选 GitHub repo，设置：
- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- 健康检查路径: `/health`
- 变量同上。

### 端口注意（重要）
Railway 会自动注入 `$PORT`（通常是随机端口），并期望进程监听该端口。
本项目后端 `src/index.ts` 应读取 `process.env.PORT ?? 8080`。请确认后端启动监听的是 `process.env.PORT`：
```ts
const port = Number(process.env.PORT) || 8080;
app.listen(port, () => ...);
```
如果当前写死 `8080`，Railway 仍能访问（它也会把 8080 映射出去），但**强烈建议改成读 `process.env.PORT`** 以兼容各平台（Render / Railway / 腾讯云都靠这个）。
一键检查：`grep -rn "listen(" backend/src`。

---

## 四、步骤 3 ｜ 前端 Vercel（改动仅 1 行）

1. 注册 https://vercel.com → New Project → 导入本仓库 → Framework 选 **Vite**，Output `dist`。
2. 打开仓库根 `vercel.json`，把 rewrite 目标改成你的 Railway 域名：
   ```json
   { "source": "/api/:path*",
     "destination": "https://<你的项目名>.up.railway.app/api/:path*" }
   ```
3. Deploy → 获得 `https://<项目>.vercel.app`。
   （浏览器访问 Vercel 域名时，`/api/*` 在 Vercel 边缘被代理到 Railway，**同源、无 CORS、前端零改**）

---

## 五、步骤 4 ｜ 验证

1. `curl https://<项目>.up.railway.app/health` → 返回 200。
2. 打开 Vercel 域名 → 走一遍志愿填报，确认推荐 + AI 建议返回正常。
3. 数据库接口数据来自 Supabase；DeepSeek 调用失败会自动降级规则引擎。

---

## 六、上线前检查清单

- [ ] Supabase 连接串已填入 Railway `DATABASE_URL`
- [ ] `DEEPSEEK_API_KEY` 在 Railway Variables（非仓库、非镜像）
- [ ] 后端 `index.ts` 监听 `process.env.PORT`（非写死 8080）
- [ ] `vercel.json` rewrite 目标 = 真实 Railway 域名
- [ ] Railway 设了 Usage Limit（$5）防超额
- [ ] `.env` / `.env.prod` 已加入 `.gitignore`

---

## 七、从 Railway 平滑升级到腾讯云

1. **数据库**：Supabase → 腾讯云 TencentDB for PostgreSQL（`pg_dump`/`pg_restore` 或 DTS）。
2. **后端**：Railway → 上海 CVM（Path B）或 TKE（Path A）；用已生成的 `backend/Dockerfile` + `deploy/docker-compose.prod.yml`。
3. **前端**：Vercel 可保留（或转腾讯云 COS+CDN）；改 `vercel.json` rewrite 目标为 CLB/域名，或改用运行时 `config.js`（见主指南第八节）。
4. **密钥**：DeepSeek Key 改存腾讯云 SSM/KMS。

> Railway 验证通过后，按 `SHANGHAI-PATHB-RUNBOOK.md` 升级即可，业务代码不变。
