# 部署实操手册（快速上线 · Path B：单台 CVM + Docker）

> 对应《腾讯云部署指南》第四节 Path B。该路径**无需改动前端代码**（前端用相对路径 `/api/v1`，由 Nginx 反代）。
> 完整架构 / 成本 / 等保 / 迁移细节见 `../deliverables/deployment/tencent-cloud-deploy-guide.md`。

## 前置准备（一次性）
1. 腾讯云购买 **CVM 标准型 S5**（建议 4核8G，MVP 可 2核4G），系统选 Ubuntu 22.04，装 Docker + docker compose 插件。
2. 购买 **云数据库 PostgreSQL 高可用版 16**（4核8G / 200GB），白名单放 CVM 内网 IP，拿到内网连接串。
3. 域名 + 免费 DV SSL 证书（如需 HTTPS）。
4. 把本目录（`deploy/`）和 `backend/`、`backend/Dockerfile`、`dist/` 传到服务器，例如 `/opt/gaokao/`。

## 数据库初始化
```bash
# 本地导出（在你的开发机）
pg_dump -Fc -h localhost -U gaokao gaokao_db > gaokao.dump
# 传到服务器后导入到 TencentDB
pg_restore -h <TencentDB内网地址> -U gaokao -d gaokao_db gaokao.dump
```
> 若用 `pgvector`，先在目标库 `CREATE EXTENSION vector;`

## 配置环境变量
```bash
cd /opt/gaokao/deploy
cp .env.prod.example .env.prod
vim .env.prod      # 填 DATABASE_URL（TencentDB 内网串）、DEEPSEEK_API_KEY、CORS_ORIGIN
```
⚠️ `.env.prod` 含密钥，**勿提交 Git**；DeepSeek Key 生产建议改由 SSM 注入。

## 启动
```bash
# 确保前端已构建（在开发机/CI 执行，产物 dist/ 已传到服务器）
npm install && npm run build

# 启动后端 + Nginx（前端静态 + /api 反代）
docker compose -f docker-compose.prod.yml up -d --build
```
- 访问 `http://<服务器IP>/` 看前端；API 在 `http://<服务器IP>/api/v1`。
- 健康检查：`curl http://<服务器IP>/health` 应返回 ok。

## HTTPS（可选但推荐）
1. 把证书放到服务器，例如 `/opt/gaokao/ssl/fullchain.pem`、`privkey.pem`。
2. 编辑 `nginx.conf`：增 `listen 443 ssl;` + `ssl_certificate` / `ssl_certificate_key`，并把 80 重定向 443。
3. 在 `docker-compose.prod.yml` 的 `web` 服务 `volumes` 增加证书挂载，并映射 `"443:443"`。
4. `docker compose -f docker-compose.prod.yml up -d web` 重新加载。

## 常用运维
```bash
docker compose -f docker-compose.prod.yml ps            # 查看状态
docker compose -f docker-compose.prod.yml logs -f api   # 后端日志
docker compose -f docker-compose.prod.yml pull && up -d --build  # 更新发版
```
- 后端日志：容器内 `/app/logs/app-YYYY-MM-DD.log`；生产建议接 CLS（见主指南第十一节）。
- 升级规格 / 加 CLB+WAF / 切 COS+CDN 生产架构：见主指南第四、九、十节。

## 排错
- 前端白屏 / 404：确认 `dist/` 已构建并挂载到 Nginx 的 `/usr/share/nginx/html`。
- `/api` 502：检查 `api` 容器是否起来、`/health` 是否正常、`DATABASE_URL` 是否可达。
- DB 连不上：确认 TencentDB 白名单含 CVM、连接串账号/密码/库名正确。
- DeepSeek 报错：检查 `DEEPSEEK_API_KEY`；失败会自动降级规则引擎（接口仍可用）。
