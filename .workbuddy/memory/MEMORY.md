# 项目记忆 - 高考志愿填报APP

## 项目概述
- **项目名称**：高考志愿填报APP（含RAG）
- **工作目录**：/Users/king/Desktop/AI 产品经理/课程文件资料/21-教育agent全生命周期-市场洞察与战略定位-26.7.6-灵玑老师/高考志愿填报APP实现含RAG
- **启动时间**：2026-07-09
- **当前阶段**：后端MVP+大模型集成完成，待用户粘贴API KEY后端到端验证

## 战略定位关键结论
- 推荐方案A："信任型决策顾问"——规则引擎+有态度AI建议+滑档保障
- 大厂免费化已关闭免费工具赛道，差异化在信任保障和价值取向建议
- 2027年高考季是唯一时间窗口
- 盈亏平衡点6-8万用户，启动预算100-200万

## 团队配置
- 产品战略团队：竞析(竞品)、瑞思(用户研究)、数析(数据分析)、路径(路线图)
- 理想创始人画像：教育行业背景+互联网产品能力

- 技术架构要点
- 大模型：通义千问/Doubao API（不自训）；MVP实际使用 DeepSeek（deepseek-v4-flash），API KEY 在 backend/.env
- RAG：结构化数据走SQL，非结构化走向量+BM25混合检索
- 防幻觉：生成后必须规则引擎回校验
- 数据源：阳光高考平台+各省考试院+麦可思就业报告（采购授权）

## 交付物索引
- 战略方案报告：deliverables/product-strategy/strategy-gaokao-zhiyuan-app-2026-07-09.md
- PRD V1.0：deliverables/product-strategy/prd-intelligent-recommendation-engine-2026-07-09.md
- 路线图评估：deliverables/product-strategy/roadmap-assessment-prd-v1-2026-07-09.md
- 后端API契约：deliverables/product-strategy/incremental-prd-backend-api-contract-2026-07-10.md
- 后端MVP架构设计：deliverables/architecture/backend-mvp-design-2026-07-10.md

## PRD关键设计决策
- 信息采集：8字段（必填5+选填3），4步Wizard，位次自动反查
- 推荐引擎：7步流水线（候选池→位次转换→四档匹配→规则回校验→风险检测→AI建议→排序）
- 信任设计：统一"历史命中率XX-XX%"替代"录取概率"，垫档≥90%硬约束
- 权重调节：混合式（3预设模板+可选高级滑块），不强制
- 异常处理：3级降级策略+新增专业四参照法（禁止放入垫档）
- 路线图调整：P1-08"AI建议文案"升级P0（战略差异化核心），时间线从8周调整为12周
- MVP试点：山东(3+3)、河北(3+1+2)、湖南(3+1+2)三省

## 后端架构关键结论（2026-07-10）
- 模块映射：模块3=数据层/分库分表；模块4=高并发缓存/流控/Kafka/静态化；模块5=高可用双活/熔断降级/故障转移/发布回滚/混沌；模块7=检索与计算性能(ES+推荐异步化+容量规划)
- 技术栈假设：Java17+Spring Boot3+Spring Cloud+Caffeine+Redis Cluster+Kafka+ES+PostgreSQL(ShardingSphere)，待确认
- 领域铁律：只读数据(院校/专业/历年线)全量预热进缓存；仅订单/支付/草稿走强一致写；其余Kafka异步化
- 三级缓存 CDN→Caffeine→Redis，洪峰读命中≥95%、P95<200ms；同城双活单AZ故障RTO<30s/RPO≈0
- 安全：等保三级+考生PII字段级加密
- 后端架构规格书：deliverables/architecture/backend-architecture-spec-2026-07-10.md + backend-architecture-topology.mermaid

## 后端MVP实现关键结论（2026-07-10）
- MVP技术栈：Node.js 18+ / Express 4 / TypeScript 5（非Java，MVP优先通路+TS类型共享）
- 数据库：PostgreSQL 16 Alpine（Docker容器，端口5432，gaokao/gaokao123）
- 后端端口8080，前端Vite proxy /api → localhost:8080
- 阶段一：22个后端文件，2接口（score-rank/lookup + recommendations/generate），硬编码复刻前端算法
- 阶段二：docker-compose.yml + 7张表 + 种子数据604行 + pg.Pool + 接口改读DB（含降级到硬编码的fallback）
- 后端目录：backend/，启动：cd backend && docker compose up -d && npm run dev

## DeepSeek大模型集成关键结论（2026-07-10）
- 模型：deepseek-v4-flash（用户指定），OpenAI兼容接口，JSON mode强制返回JSON
- 核心文件：backend/src/services/llm.service.ts（提示词构建+API调用+解析校验补全）
- 数据流：前端传完整RecommendationRequest → 后端整合system+user提示词 → 调DeepSeek → 解析校验 → 返回TierRecommendations → 失败降级规则引擎
- 降级策略：API Key未配置/超时/格式异常/数量偏差>2 → 自动降级 generateRecommendationsByRules（原硬编码逻辑），前端无感
- env配置：DEEPSEEK_API_KEY（用户粘贴）/ DEEPSEEK_BASE_URL(https://api.deepseek.com) / DEEPSEEK_MODEL(deepseek-v4-flash) / LLM_TIMEOUT(60000ms)
- 前端动画：LoadingOverlay已有，generating=true时显示，数据返回后自动隐藏
- 待办：用户需在 backend/.env 粘贴真实 DEEPSEEK_API_KEY

## 日志系统（2026-07-12）
- 新增 backend/src/utils/logger.ts：单例 Logger，实时彩色控制台 + 定时写盘（默认每3s flush，ERROR 立即写）+ 按天滚动文件 logs/app-YYYY-MM-DD.log
- 进程退出/崩溃（exit/uncaughtException/unhandledRejection）同步落盘，避免丢日志
- 配置项（backend/.env）：LOG_DIR / LOG_LEVEL(info) / LOG_TO_FILE(true) / LOG_CONSOLE(true) / LOG_FLUSH_INTERVAL_MS(3000)
- 接入点：index/error/app(requestLogger中间件)/recommendation/llm/db.pool/mail/scoreRank 全部替换 console.* 为 logger
- 新增 backend/src/middleware/requestLogger.ts：记录每请求 method/url/status/durationMs/ip，按状态码定级别（5xx→error,4xx→warn）
- 排查方式：实时看终端；历史看 backend/logs/app-$(date +%F).log；可 tail -f 跟踪

## 前端动效升级（2026-07-12）
- 新增开源依赖：canvas-confetti（庆祝彩带）、sonner（Toast）、framer-motion 原有
- 新增文件：PageTransition.tsx（页面转场，包在 AppLayout 内全覆盖所有页面）、AppToaster.tsx（sonner 容器，挂 main.tsx）、utils/confetti.ts（fireCelebration）、hooks/useCountUp.ts（数字滚动）
- 动效清单：页面淡入上滑转场 / 推荐卡片悬浮上浮+点击缩放 / 结果页入场 stagger + 生成成功彩带+Toast / 底部CTA按钮微交互+流光shimmer / 档位Tab滑动指示条(layoutId) / 命中率圆环SVG描边绘制+百分比count-up / 首页信任卡&功能卡stagger+Hero emoji浮动 / Loading遮罩呼吸光晕
- 修复：src/utils/profile.ts 一处 FormData→Record 类型转换报错（pre-existing，导致 tsc -b 失败），改为先 as unknown 再 as Record，使 npm run build 通过
- 验证：前端 npm run build 通过（1995 模块）；vite dev 正常起服；后端 tsc 通过 + 实跑确认控制台与日志文件均输出
