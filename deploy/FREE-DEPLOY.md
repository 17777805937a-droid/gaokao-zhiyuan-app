# 免费部署指南（Vercel + Render + Supabase）

> 适用场景：想**零成本**把高考志愿填报 APP 跑在公网上，验证产品 / 给早期用户试用。
> 前提：你已选择「免费平台」而非付费腾讯云（见 `tencent-cloud-deploy-guide.md`）。
> 代码改动：前端**零改动**（仍用相对路径 `/api/v1`）；后端**零改动**（仅环境变量不同）。

---

## 一、免费平台组合与限制（先看清再决定）

| 层 | 平台 | 免费额度 | 关键限制 |
|----|------|---------|---------|
| 前端静态 | **Vercel** | 无限静态带宽、自动 HTTPS、自定义域名 | 纯静态 + rewrite 代理，无服务端计算（本方案前端即纯静态） |
| 后端服务 | **Render** (free) | 512MB RAM / 0.1 vCPU，每月 750 小时 | **15 分钟无流量自动休眠**，冷启动 30s+；不适合高并发 |
| 数据库 | **Supabase** (free) | PostgreSQL 500MB，含控制台/SQL 编辑器 | 项目长时间无连接会暂停；500MB 对 604 行种子绰绰有余 |

⚠️ **高考季现实**：志愿填报流量高度季节性、峰值极高。免费层**扛不住正式高考季洪峰**。
本方案定位 = **MVP 验证 / 内部试用 / 给投资人演示**。正式上线请回 `tencent-cloud-deploy-guide.md`（上海 Path B 或 Path A）。

> 💡 **推荐后端：Railway（不休眠，比 Render 更适合真实用户）**
> 若你不想后端 15 分钟就休眠、冷启动卡 30 秒，**直接用 Railway**：它采用 $5/月额度制（低频基本花不到，等同免费）、服务**不休眠**、自带 HTTPS 域名、冷启动快。
> 👉 完整步骤见 **`deploy/RAILWAY-DEPLOY.md`**（配套 `deploy/railway.json` 已生成）。

其他备选（按需替换 Render）：
- **Fly.io**：有免费额度，可多区域，但配置略复杂。
- **Koyeb / Cyclic**：类似 Render，免费层更简单但社区小。

---

## 二、步骤 1 ｜ 数据库 Supabase

1. 注册 https://supabase.com → New Project（地区选 **Northeast Asia (Tokyo)** 或 Singapore，离国内近）。
2. 等待建库完成 → **Project Settings → Database → Connection string**，复制 URI 形式连接串：
   `postgresql://postgres:<密码>@db.<项目ID>.supabase.co:5432/postgres`
3. 把本地种子数据迁过去（本地需有 `psql` / `pg_dump`）：
   ```bash
   # 本地导出（你的 Docker PG，端口 5432，库名 gaokao）
   pg_dump -Fc -h localhost -p 5432 -U gaokao gaokao \
     > /tmp/gaokao.dump

   # 恢复到 Supabase（连接串见上方）
   pg_restore -h db.<项目ID>.supabase.co -p 5432 -U postgres \
     -d postgres --no-owner --clean --if-exists /tmp/gaokao.dump
   ```
4. 校验：Supabase SQL Editor 跑 `SELECT count(*) FROM <你的表>;` 确认 7 张表 + 604 行种子到位。
   > 若后端用到了 `pgvector` 等扩展，需在 Supabase 的 Database → Extensions 里开启。

---

## 三、步骤 2 ｜ 后端 Render

> 已生成 `deploy/render.yaml`（含 rootDir=backend、build/start、healthCheck=/health、`sync:false` 的环境变量）。

**方式 A（推荐，自动识别）**：把 `deploy/render.yaml` 复制到**仓库根目录**命名为 `render.yaml`，然后：
1. 注册 https://render.com → New → Blueprint → 链接本 GitHub 仓库。
2. Render 读到 `render.yaml` 自动建 `gaokao-backend` 服务（plan=free）。
3. 在 Render 控制台为该服务手动填入两个 `sync:false` 变量：
   - `DATABASE_URL` = Supabase 连接串
   - `DEEPSEEK_API_KEY` = 真实 DeepSeek 密钥
4. 部署完成，记下后端地址 `https://gaokao-backend.onrender.com`。

**方式 B（手动）**：New → Web Service → 链接仓库，手动填：
- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `npm run start`
- Health Check Path: `/health`
- 环境变量同上。

---

## 四、步骤 3 ｜ 前端 Vercel

1. 注册 https://vercel.com → New Project → 导入本 GitHub 仓库。
2. Vercel 自动识别根目录 `package.json`，Framework 选 **Vite**，Output `dist`，Build `npm run build`。
3. **关键一步**：打开仓库根目录的 `vercel.json`，把 rewrite 目标改成你的 Render 后端地址：
   ```json
   { "source": "/api/:path*",
     "destination": "https://gaokao-backend.onrender.com/api/:path*" }
   ```
   （这样前端 `/api/v1/...` 在 Vercel 边缘被代理到 Render，**浏览器同源、无需 CORS、前端代码零改动**）
4. Deploy → 获得 `https://<你的项目>.vercel.app`。
5. 可选：Settings → Domains 绑定自己的域名（免费，自动 HTTPS）。

---

## 五、步骤 4 ｜ 验证

1. 浏览器打开 Vercel 域名 → 走一遍志愿填报流程，确认推荐结果返回。
2. 直接打后端：`curl https://gaokao-backend.onrender.com/health` 应返回 200。
3. DeepSeek 调用：提交一次含 AI 建议的请求，确认大模型返回（失败会自动降级规则引擎，前端无感）。
4. 数据库：确认列表/详情接口数据来自 Supabase。

---

## 六、上线前检查清单

- [ ] Supabase 连接串已填入 Render `DATABASE_URL`，非本地地址
- [ ] `DEEPSEEK_API_KEY` 在 Render 控制台（非仓库、非镜像）
- [ ] `vercel.json` 的 rewrite 目标 = 真实 Render 域名
- [ ] 本地 `.env` / `.env.prod` 已加入 `.gitignore`（不提交密钥）
- [ ] 已跑通一次完整志愿填报 + AI 建议链路

---

## 七、从免费平滑升级（将来回腾讯云）

1. **数据库**：Supabase → 腾讯云 TencentDB for PostgreSQL（`pg_dump`/`pg_restore` 或 DTS）。
2. **后端**：Render → 上海 CVM（Path B）或 TKE（Path A）；用已生成的 `backend/Dockerfile` + `deploy/docker-compose.prod.yml`。
3. **前端**：Vercel → 腾讯云 COS+CDN（Path A）或继续 Vercel（都行）；若走腾讯云只需把 `vercel.json` rewrite 目标改成 CLB/域名，或改用运行时 `config.js`（见主指南第八节）。
4. **密钥**：DeepSeek Key 改存腾讯云 SSM/KMS，不再明文 env。

> 免费层验证通过后，按 `SHANGHAI-PATHB-RUNBOOK.md` 或 `tencent-cloud-deploy-guide.md` 升级即可，业务代码不变。
