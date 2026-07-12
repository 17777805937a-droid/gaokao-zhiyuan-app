#!/bin/bash
# ============================================================
# 高考志愿填报APP 后端一键启动脚本
# macOS 双击此文件即可启动后端服务
# ============================================================

# 切换到脚本所在目录（双击时工作目录是 $HOME，必须修正）
cd "$(dirname "$0")" || { echo "❌ 无法切换到脚本目录"; read -n 1; exit 1; }

# ---------- 颜色与工具函数 ----------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------- 横幅 ----------
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  高考志愿填报APP - 后端服务启动器${NC}"
echo -e "${CYAN}  Backend: http://localhost:8080${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# ---------- Step 1: 检查 Node.js ----------
info "检查 Node.js ..."
if ! command -v node >/dev/null 2>&1; then
    err "未检测到 Node.js，请先安装 Node.js 18+ (https://nodejs.org)"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi
NODE_VERSION=$(node -v)
ok "Node.js 已安装: ${NODE_VERSION}"

# ---------- Step 2: 检查 Docker ----------
info "检查 Docker ..."
if ! command -v docker >/dev/null 2>&1; then
    err "未检测到 Docker，请先安装 Docker Desktop (https://www.docker.com/products/docker-desktop)"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 检查 Docker 守护进程是否运行
if ! docker info >/dev/null 2>&1; then
    warn "Docker 守护进程未运行，正在尝试启动 Docker Desktop ..."
    open -a Docker 2>/dev/null
    info "等待 Docker 启动 ..."
    DOCKER_WAIT=0
    while ! docker info >/dev/null 2>&1; do
        sleep 2
        DOCKER_WAIT=$((DOCKER_WAIT + 2))
        if [ $DOCKER_WAIT -ge 60 ]; then
            err "Docker 启动超时（60s），请手动启动 Docker Desktop 后重试"
            echo ""
            echo "按任意键退出..."
            read -n 1
            exit 1
        fi
        printf "."
    done
    echo ""
    ok "Docker 已启动"
else
    ok "Docker 正在运行"
fi

# ---------- Step 3: 安装依赖（仅当 node_modules 缺失时） ----------
if [ ! -d "node_modules" ]; then
    warn "未检测到 node_modules，开始安装依赖 ..."
    npm install
    if [ $? -ne 0 ]; then
        err "依赖安装失败，请检查网络后重试"
        echo ""
        echo "按任意键退出..."
        read -n 1
        exit 1
    fi
    ok "依赖安装完成"
else
    ok "依赖已就绪 (node_modules)"
fi

# ---------- Step 4: 启动 PostgreSQL 容器 ----------
info "启动 PostgreSQL 容器 ..."
docker compose up -d
if [ $? -ne 0 ]; then
    err "PostgreSQL 容器启动失败"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# ---------- Step 5: 等待数据库就绪 ----------
info "等待数据库就绪 ..."
DB_WAIT=0
MAX_DB_WAIT=30
while ! docker exec gaokao-postgres pg_isready -U gaokao -d gaokao_db >/dev/null 2>&1; do
    sleep 1
    DB_WAIT=$((DB_WAIT + 1))
    if [ $DB_WAIT -ge $MAX_DB_WAIT ]; then
        err "数据库就绪超时（${MAX_DB_WAIT}s），请检查容器状态：docker logs gaokao-postgres"
        echo ""
        echo "按任意键退出..."
        read -n 1
        exit 1
    fi
    printf "."
done
echo ""
ok "PostgreSQL 已就绪"

# ---------- Step 6: 显示连接信息 ----------
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  ✅ 后端环境已就绪，正在启动服务 ...${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  服务地址:    ${CYAN}http://localhost:8080${NC}"
echo -e "  数据库:      ${CYAN}postgresql://gaokao:****@localhost:5432/gaokao_db${NC}"
echo -e "  健康检查:    ${CYAN}http://localhost:8080/api/health${NC}"
echo ""
echo -e "  ${YELLOW}停止服务：Ctrl + C${NC}"
echo -e "  ${YELLOW}停止数据库：cd backend && docker compose down${NC}"
echo ""

# ---------- Step 7: 启动后端服务（前台运行，Ctrl+C 退出） ----------
info "启动后端服务 (npm run dev) ..."
echo ""
npm run dev

# ---------- 退出处理 ----------
echo ""
warn "后端服务已停止"
echo ""
echo "按任意键关闭窗口..."
read -n 1
