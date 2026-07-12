#!/bin/bash
# ============================================================
# 高考志愿填报APP 后端一键停止脚本
# macOS 双击此文件即可停止后端服务与数据库
# ============================================================

cd "$(dirname "$0")" || { echo "❌ 无法切换到脚本目录"; read -n 1; exit 1; }

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }

echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  高考志愿填报APP - 后端服务停止器${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# 停止占用 8080 端口的 Node 进程（即后端服务）
info "停止后端服务 (端口 8080) ..."
PID=$(lsof -ti:8080 2>/dev/null)
if [ -n "$PID" ]; then
    kill $PID 2>/dev/null
    sleep 1
    # 如果还活着，强制杀
    if lsof -ti:8080 >/dev/null 2>&1; then
        kill -9 $PID 2>/dev/null
    fi
    ok "后端服务已停止 (PID: $PID)"
else
    warn "未检测到运行中的后端服务"
fi

# 停止 PostgreSQL 容器
info "停止 PostgreSQL 容器 ..."
if docker compose ps -q postgres >/dev/null 2>&1 && [ -n "$(docker compose ps -q postgres 2>/dev/null)" ]; then
    docker compose down
    ok "PostgreSQL 容器已停止并移除"
else
    warn "PostgreSQL 容器未运行"
fi

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  ✅ 所有服务已停止${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "按任意键关闭窗口..."
read -n 1
