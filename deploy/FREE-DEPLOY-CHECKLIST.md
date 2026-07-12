# 免费部署执行清单（三平台已注册）

> 你已经注册了 Supabase / Railway / Vercel。下面是我**无法代劳**（需登录你的控制台 + 你的私有凭证）的步骤，**精确到按钮**。
> 顺序：先 Supabase 建库 → 再 Railway 部署拿域名 → 最后 Vercel 部署。
> 业务代码**零改动**，前端仍走相对路径 `/api/v1`。

---

## ⓪ 把本地项目推到 GitHub（前置必做，否则 Railway/Vercel 选不到仓库）

> 你的项目之前只在本地、从未推到 GitHub，所以 Railway 导入列表为空。本地我已帮你 `git init` + 提交（158 文件，密钥/依赖已排除）。详细按钮级步骤见 **`deploy/PUSH-TO-GITHUB.md`**：建空仓库 → 生成 PAT → `git push -u origin main` → 回到 Railway 点 Refresh。

---

## ① Supabase（建库 + 灌种子）

1. 打开 https://supabase.com → **New Project**
   - Name：随便（如 `gaokao`）
   - **Database Password**：记下来（后面 Connection string 里要用）
   - Region：**Tokyo (ap-northeast-1)** 或 **Singapore**（离国内近）
   - Plan：Free
   - 点 **Create new project**（等 1–2 分钟初始化）
2. 左侧菜单 **SQL Editor** → **New query**
   - 打开本仓库 `deploy/supabase-init.sql` → 全选复制 → 粘贴进编辑器
   - 点 **Run**（顶部▶）→ 看到 `Success. No rows returned` 即成功
3. 验证（在 SQL Editor 粘贴执行）：
   ```sql
   SELECT count(*) FROM school_info;     -- 应返回 8
   SELECT count(*) FROM score_rank;      -- 应返回 186
   SELECT count(*) FROM score_line;      -- 应返回 240
   ```
4. 左侧 **Project Settings → Database** → 滚到 **Connection string** → 选 **URI** → 复制：
   ```
   postgresql://postgres:<你的DB密码>@db.<项目ID>.supabase.co:5432/postgres
   ```
   👉 这就是后面要填进 Railway 的 `DATABASE_URL`。

---

## ② Railway（部署后端，拿域名）

> 前提：Railway 已用 GitHub 登录；本仓库已 `git push` 到 GitHub；仓库根目录有我放好的 `railway.json`（指向 `backend/`）。

### 2.1 新建项目并关联仓库
1. 打开 https://railway.app → 右上角 **「New Project」**（或中间大按钮）
2. 选 **「Deploy from GitHub repo」**（不要选 Empty Project / Template）
3. 若弹出 GitHub 授权 → 点 **「Authorize Railway」** → 在 GitHub 弹窗里 **「Authorize」**
   - ⚠️ 若列表里看不到你的仓库：去 GitHub → Settings → Applications → Railway → **Repository access** → 改成 `Only select repositories` 并勾选本仓库 → Save，再回 Railway 刷新
4. 在仓库列表点 **本仓库** → Railway 读取根目录 `railway.json` → 自动识别：
   - 构建目录 `backend/`、构建方式 Nixpacks、`/health` 健康检查、失败自动重启
5. 点 **「Deploy」** 开始首次构建
   - 首次会因缺 `DATABASE_URL` / `DEEPSEEK_API_KEY` **启动失败（红色），这是正常的**，下一步补变量后会自动重部署

### 2.2 填写环境变量（关键）
1. 点进项目 → 左侧 **「Variables」**
2. 推荐用批量方式：点 **「Raw Editor」**（或 `{}` 图标）→ 粘贴下面整段 → **Save**：
   ```
   DATABASE_URL=postgresql://postgres:你的Supabase密码@db.xxxx.supabase.co:5432/postgres
   DEEPSEEK_API_KEY=sk-你的真实密钥
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   DEEPSEEK_MODEL=deepseek-v4-flash
   LLM_TIMEOUT=60000
   NODE_ENV=production
   ```
   （也可点 **「New Variable」** 逐个加，Key/Value 对照下表）
   | Key | Value（说明） |
   |-----|-----|
   | `DATABASE_URL` | ① 第 4 步复制的 Supabase URI |
   | `DEEPSEEK_API_KEY` | 真实 DeepSeek 密钥（sk- 开头） |
   | `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
   | `DEEPSEEK_MODEL` | `deepseek-v4-flash` |
   | `LLM_TIMEOUT` | `60000` |
   | `NODE_ENV` | `production` |
3. 保存后 Railway **自动重新部署**（顶部状态 Building → Success 绿勾）

### 2.3 设花费上限 + 拿域名
1. 左侧 **「Settings」** → **「Usage」**（或 Billing）→ **「Usage Limit」** → 填 **`5`** → Save（封顶 $5/月，防超额）
2. 左侧 **「Settings」** → **「Domains」**（旧版在 Networking）→ 点 **「Generate Domain」**
3. 得到 `https://<项目名>.up.railway.app` → **复制**备用（Vercel 要用）

### 2.4 验证后端活着
本地终端：
```bash
curl https://<项目名>.up.railway.app/health
```
返回 `200` / `OK` 即后端已上线。

---

## ③ Vercel（部署前端，接 Railway）

> 前提：Vercel 已用 GitHub 登录；本仓库已 `git push`；根目录有 `vercel.json`（已引用 `${RAILWAY_BACKEND_URL}`）。

### 3.1 导入仓库
1. 打开 https://vercel.com → 右上角 **「Add New...」** → **「Project」**
2. 在 **「Import Git Repository」** 列表点 **本仓库** 的 **「Import」**
3. 配置项（多数自动识别，确认即可）：
   - **Framework Preset**：`Vite`（没识别就手动选）
   - **Root Directory**：`/` 仓库根（vite.config.ts 在根目录）
   - **Build Command**：`npm run build`（自动）
   - **Output Directory**：`dist`（自动）
   - **Install Command**：`npm install`（自动）

### 3.2 设环境变量 RAILWAY_BACKEND_URL（关键，决定 API 打到哪）
1. 在导入页的 **「Environment Variables」** 区（或进项目后 **Settings → Environment Variables**）：
   - 点 **「Add」** → Key 填 `RAILWAY_BACKEND_URL`，Value 填 `<项目名>.up.railway.app`
     - ⚠️ **只填域名、不要 `https://`、不要末尾斜杠**（vercel.json 里已自带 `https://` 前缀）
   - Environment 选 **Production**（默认即可）
2. 点 **「Deploy」**（若先 Deploy 后补变量，见 3.3 第 2 步）

### 3.3 部署 & 验证
1. Vercel 跑 `npm install` + `npm run build` → 产出 `dist/` → 部署完成
2. 若**先 Deploy 后补的 env 变量**：进 **「Deployments」** → 最新那条 → **「Redeploy」**（让 rewrite 重新读取变量）
3. 拿到 `https://<项目>.vercel.app` → 浏览器打开 → 走一遍志愿填报：
   - 应看到院校推荐 + AI 建议；DeepSeek 抖动时接口会**自动降级**到规则引擎，页面仍出结果
4. 自查：浏览器 F12 → Network → 点「生成推荐」→ 请求 URL 应是 `https://<项目>.vercel.app/api/...`（同源，经 Vercel 反代到 Railway），状态码 200

---

## ✅ 上线后自检

- [ ] Supabase 三张表行数正确（8 / 186 / 240）
- [ ] Railway `/health` 返回 200
- [ ] `DEEPSEEK_API_KEY` 在 Railway Variables（不在仓库、不在镜像）
- [ ] Vercel 环境变量 `RAILWAY_BACKEND_URL` = 真实 Railway 域名（不含 `https://`）
- [ ] Railway Usage Limit = $5
- [ ] `.env` / `.env.prod` 已被 `.gitignore` 忽略（已帮你建好）

## ⚠️ 限制（务必知道）
- Railway 是 **$5/月额度制**（非永久免费，低频基本花不到）；Supabase 免费 **500MB**（种子绰绰有余）。
- 免费层**扛不住高考季洪峰**，正式上线请按 `deploy/SHANGHAI-PATHB-RUNBOOK.md` 回腾讯云（业务代码不变）。
- 若 Railway 后端调用 DeepSeek 失败，接口会**自动降级**到规则引擎，页面仍可出推荐。
