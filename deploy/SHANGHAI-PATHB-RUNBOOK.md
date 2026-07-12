# 上海 · Path B 上线执行手册（单台 CVM + Docker，零改前端）

> 决策锁定：**地域 = 上海（华东 ap-shanghai）** ｜ **路径 = Path B（快速上线，前端由 Nginx 反代，无需改代码）**
> 适用范围：MVP 验证 / 立即上线；业务起量后再按需切 Path A（COS+CDN + CLB+WAF，见主指南）。
> 配套文件：`docker-compose.prod.yml` / `nginx.conf` / `.env.prod.example` / `DEPLOY.md` / `backend/Dockerfile`。

---

## A. 购买清单（控制台，地域必须选「上海 ap-shanghai」）

| 资源 | 推荐规格 | 备注 |
|------|---------|------|
| CVM 标准型 S5 | **4核8G**（MVP 可 2核4G）/ Ubuntu 22.04 / 系统盘 50–100GB SSD | 公网带宽按流量计费 5–10 Mbps，包年约 ¥300–500/月 |
| 云数据库 PostgreSQL **高可用版** 16 | 4核8G / 200GB SSD（MVP 可 2核4G / 100GB） | 同地域同 VPC；开自动备份 + PITR；约 ¥900–1,300/月 |
| 域名 + 免费 DV SSL（可选） | DNSPod 解析 | 等保建议后续换 OV |
| 安全组 | 入站放 22(你的IP/堡垒机)、80、443；**8080 仅内网** | 防直接暴露后端端口 |

> 上海可用区示例：ap-shanghai-2 / ap-shanghai-3。Path B 先用单台 CVM 即可。

## B. 网络（上海）
1. 建 VPC（如 `10.0.0.0/16`）+ 2 个子网跨可用区（为以后多实例/CLB 留余地）。
2. CVM 与 TencentDB 放**同一 VPC**；DB 白名单加 CVM 内网 IP。

## C. 初始化数据库（上海）
1. 控制台创建 TencentDB PG 16 高可用版，记录**内网地址**（形如 `sh-xxxxxx.pg.ap-shanghai.tencentcloud.com`）。
2. 本地导出（开发机）：
   ```bash
   pg_dump -Fc -h localhost -U gaokao gaokao_db > gaokao.dump
   ```
3. 传到 CVM 后导入：
   ```bash
   pg_restore -h sh-xxxxxx.pg.ap-shanghai.tencentcloud.com -U gaokao -d gaokao_db gaokao.dump
   ```
4. 若用 `pgvector`：先 `CREATE EXTENSION vector;`（版本匹配）。
5. 校验 7 张表 + 604 行种子 + 索引；跑核心查询 + RAG 召回。

## D. 上传代码到 CVM
把以下目录传到服务器 `/opt/gaokao/`：
- `backend/`（含 `Dockerfile`、`.dockerignore`）
- `dist/`（前端构建产物；也可在 CVM 上 `npm run build`）
- `deploy/`（含 `docker-compose.prod.yml`、`nginx.conf`、`.env.prod.example`）

CVM 上安装 Docker + compose 插件：
```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # 重登生效
```

## E. 配置环境变量（上海）
```bash
cd /opt/gaokao/deploy
cp .env.prod.example .env.prod
vim .env.prod
```
关键项：
- `DATABASE_URL` → 填上海 TencentDB **内网**地址（见 C.1）
- `DEEPSEEK_API_KEY` → 真实 Key（生产建议改 SSM 注入，勿硬编码）
- `CORS_ORIGIN` → 你的域名或 `*`(临时)

## F. 启动
```bash
# 若 dist 未在开发机构建，先在 CVM 上：
#   cd /opt/gaokao && npm install && npm run build
docker compose -f docker-compose.prod.yml up -d --build
```

## G. 验证 + 上线
```bash
docker compose -f docker-compose.prod.yml ps
curl http://localhost/health          # 应返回 ok
curl -k https://localhost/api/v1/score-rank/lookup ...   # 或用浏览器访问 http://<公网IP>/
```
- 浏览器打开 `http://<公网IP>/` 应见前端；志愿填报走 `/api/v1` 由 Nginx 反代到后端。

## H. HTTPS（可选但推荐）
1. 申请免费 DV 证书，下载 `fullchain.pem` / `privkey.pem` 放到 CVM `/opt/gaokao/ssl/`。
2. `nginx.conf` 增加 `listen 443 ssl;` + `ssl_certificate`/`ssl_certificate_key`，80 跳转 443。
3. `docker-compose.prod.yml` 的 `web` 服务挂载证书并映射 `"443:443"`，然后：
   ```bash
   docker compose -f docker-compose.prod.yml up -d web
   ```
4. DNSPod 将域名 A 记录指向 CVM 公网 IP。

## I. 上线前检查清单
- [ ] 地域选 ap-shanghai，CVM 与 DB 同 VPC 同地域
- [ ] DB 白名单仅放 CVM 内网 IP，8080 不对外
- [ ] `.env.prod` 已填真实值，且**未提交 Git**
- [ ] `DEEPSEEK_API_KEY` 不进镜像层（已由 `.dockerignore` 排除；生产接 SSM）
- [ ] `docker compose up` 成功，`/health` 正常
- [ ] 数据库迁移后表/行/索引校验通过
- [ ] （生产）已接 CLS 日志、云监控告警；等保所需 WAF/堡垒机/审计/KMS 已排期

## J. 后续可平滑升级（无需重做）
- 流量上来 → 加第二台 CVM 跨 AZ，前置 **CLB + WAF**（主指南第九节）。
- 静态资源要走边缘 → 前端搬 **COS+CDN**，此时需按主指南第八节加运行时 `config.js`（Path A）。
- 想自动化 → 用 `ci-github-actions.example.yml` 接 CI/CD。
