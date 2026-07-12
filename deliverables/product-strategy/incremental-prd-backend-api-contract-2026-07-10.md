# 增量PRD — 后端 API 接口契约（前后端通路）

| 字段 | 内容 |
|------|------|
| 文档版本 | V1.0 |
| 文档类型 | 增量 PRD（接口契约层） |
| 产品经理 | 许清楚（Alice） |
| 日期 | 2026-07-10 |
| 输入 | 前端数据契约（`src/data/dynamic/index.ts`、`src/types/`、`src/hooks/`）、后端架构规格书 V1.0 |
| 目标 | 定义后端 API 接口契约，分两阶段打通前后端通路 |
| 约束 | RESTful 设计；`/api/v1/` 前缀；与前端现有类型定义**完全对齐**，前端改动最小化 |

---

## 0. 背景与设计原则

### 0.1 现状

前端已用 React+Vite+Zustand 完整实现，当前所有数据通过本地 mock 提供：

- **动态数据**（`src/data/dynamic/`）：两个核心同步契约函数
  - `getScoreRank(provinceCode, category, score): number` — 分数位次反查
  - `getRecommendations(provinceCode, userRank): TierRecommendations` — 推荐生成
- **静态配置数据**（`src/data/static/`）：8 个 JSON 文件，经 `src/data/static/index.ts` 薄桶 re-export，构建期打包进 bundle。

### 0.2 两阶段策略

| 阶段 | 目标 | 数据来源 | 前端改动 |
|------|------|---------|---------|
| **阶段一（通路）** | 不接数据库，后端返回写死数据，打通前后端通路 | 后端硬编码常量/JSON（复刻前端 mock 算法与素材） | 仅 2 个动态函数由同步改异步 fetch + vite proxy |
| **阶段二（数据库）** | 接入 PostgreSQL，接口改为读 DB | PostgreSQL（按省份分片，见架构书 §5.1） | 动态接口 URL 不变；静态配置可选迁移为 API |

### 0.3 设计原则

1. **类型完全对齐**：后端响应体字段名、类型与前端 `src/types/recommendation.ts`、`src/types/form.ts` 的 interface **一一对应**，前端无需改类型定义。
2. **前端改动最小**：阶段一只改 `src/data/dynamic/index.ts`（同步→异步）+ `vite.config.ts`（proxy）+ 少量调用点。静态配置数据暂不动。
3. **统一响应格式**：所有接口返回 `{ code: number, message: string, data: T }`。
4. **MVP 同步优先**：推荐生成阶段一设计为**同步返回**（前端已有 Loading 态）。架构书的 Kafka 异步方案作为阶段三演进路径，不在本次范围。
5. **算法迁移**：阶段一后端复刻前端 `getScoreRank` 的位次算法（含 `provinceFactor`、history×0.4 系数）与 `getRecommendations` 的拼装逻辑，保证前后端结果一致。

---

## 1. 接口清单总表

| # | Method | Path | 用途 | 阶段 | 数据来源 |
|---|--------|------|------|------|---------|
| 1 | POST | `/api/v1/score-rank/lookup` | 分数→位次反查（累计位次 + 同分人数） | 一 | 硬编码算法 + `provinceFactor` |
| 2 | POST | `/api/v1/recommendations/generate` | 生成冲稳保垫四档推荐方案 | 一 | 硬编码 `schoolPool`/`majorPool` 等素材 + 拼装逻辑 |
| 3 | GET | `/api/v1/recommendations/{id}` | 推荐项详情（阶段二就绪） | 二 | PostgreSQL |
| 4 | GET | `/api/v1/config` | 静态配置聚合（省份/科目/权重模板/四档/选项） | 二（可选一） | PostgreSQL |
| 5 | GET | `/api/v1/schools/{code}` | 院校详情 | 二 | PostgreSQL |
| 6 | GET | `/api/v1/majors/{code}` | 专业详情 | 二 | PostgreSQL |
| 7 | GET | `/api/v1/search/suggest` | 院校/专业名模糊联想 | 二 | Elasticsearch（架构书 §5.4） |

> **阶段一必须实现：仅 #1、#2。** 其余为阶段二（或更后）范围，本文给出契约以供后续实现，但阶段一不阻塞前端通路。

---

## 2. 统一约定

### 2.1 统一响应格式

```typescript
interface ApiResponse<T> {
  /** 业务状态码：0=成功，非 0=失败（见 §2.2） */
  code: number;
  /** 提示信息，成功为 "ok"，失败为可读错误描述 */
  message: string;
  /** 业务数据，失败时为 null */
  data: T | null;
}
```

### 2.2 业务状态码

| code | 含义 | HTTP 状态 |
|------|------|----------|
| 0 | 成功 | 200 |
| 1001 | 参数校验失败 | 400 |
| 1002 | 资源不存在 | 404 |
| 2001 | 服务内部错误 | 500 |
| 2002 | 上游依赖超时（阶段二） | 504 |

### 2.3 请求约定

- Content-Type: `application/json; charset=utf-8`
- 阶段一无鉴权（MVP 本地联调）；阶段二接入 JWT（架构书 §7.1）。
- 时间字段统一 ISO 8601（UTC）。

---

## 3. 接口详细契约

### 3.1 【阶段一】POST /api/v1/score-rank/lookup — 分数位次反查

**对齐前端**：`src/hooks/useScoreRankLookup.ts` 的 `mockScoreRankLookup` + `src/types/form.ts` 的 `RankLookupResult`。

#### 请求

```
POST /api/v1/score-rank/lookup
```

**请求体**：

```typescript
interface ScoreRankLookupRequest {
  /** 省份编码：'37'山东 / '13'河北 / '43'湖南 */
  provinceCode: string;
  /** 选科类别：'physics'物理类 / 'history'历史类 / 'comprehensive'综合（旧高考） */
  subjectCategory: 'physics' | 'history' | 'comprehensive';
  /** 高考总分，取值 0-750 */
  score: number;
}
```

> 注：前端 `form.ts` 的 `SubjectCategory` 即此三值。前端 `getScoreRank` 内部曾用 `'all'`，属内部别名（`comprehensive`→`all`），后端统一接收 `'comprehensive'`，内部按"综合类"处理（不应用 history ×0.4 系数）。

**示例**：

```json
{
  "provinceCode": "37",
  "subjectCategory": "physics",
  "score": 600
}
```

#### 响应

**成功（code=0）**：

```typescript
interface ScoreRankLookupResponse {
  /** 累计位次（省排名），即该分数对应的全省最低位次 */
  cumulativeCount: number;
  /** 同分人数（该分数段考生数） */
  countAtScore: number;
}
```

**示例**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "cumulativeCount": 12048,
    "countAtScore": 32
  }
}
```

**失败示例（参数缺失）**：

```json
{
  "code": 1001,
  "message": "score 必须为 0-750 的数字",
  "data": null
}
```

#### 阶段一后端实现要点（复刻前端算法）

后端需复刻 `src/data/dynamic/index.ts` 的 `getScoreRank` 算法，保证结果一致：

```
provinceFactor = { '37': 1.2, '13': 1.0, '43': 0.9 }
factor = provinceFactor[provinceCode] (默认1.0) * (subjectCategory === 'history' ? 0.4 : 1.0)
baseRank = round((750 - score) * (80 + score * 0.08) * factor)
cumulativeCount = max(baseRank, 1)

# 同分人数（复刻 useScoreRankLookup.mockScoreRankLookup）
countAtScore = max(round(50 - (750 - score) * 0.06), 5)
```

- 数据来源：`provinceFactor` 硬编码为常量（对齐 `src/data/dynamic/scoreRank.json`）。
- 验收：相同输入下，后端返回的 `cumulativeCount` 与前端 `getScoreRank` 结果**完全一致**。

---

### 3.2 【阶段一】POST /api/v1/recommendations/generate — 生成推荐方案

**对齐前端**：`src/data/dynamic/index.ts` 的 `getRecommendations` + `src/types/recommendation.ts` 的 `TierRecommendations` / `Recommendation`。

#### 请求

```
POST /api/v1/recommendations/generate
```

**请求体**：

```typescript
interface GenerateRecommendationsRequest {
  /** 省份编码 */
  provinceCode: string;
  /** 省位次（由 3.1 接口反查或用户手填） */
  userRank: number;
}
```

> 阶段一签名与前端 `getRecommendations(provinceCode, userRank)` 完全一致。前端表单中的偏好/权重当前**未传入** mock 生成器，阶段一保持一致。阶段二可扩展 `preferences` 可选字段（见 §6 待确认 Q-03）。

**示例**：

```json
{
  "provinceCode": "37",
  "userRank": 12048
}
```

#### 响应

**成功（code=0）**：

```typescript
interface TierRecommendations {
  rush: Recommendation[];       // 冲刺档，19 条
  stable: Recommendation[];     // 稳妥档，12 条
  preserve: Recommendation[];   // 保底档，14 条
  cushion: Recommendation[];    // 垫底档，5 条
}

interface Recommendation {
  id: string;
  school: string;
  major: string;
  tags: string[];
  tier: 'rush' | 'stable' | 'preserve' | 'cushion';
  hitRate: string;              // 如 "30-40%"
  hitRateMin: number;
  hitRateMax: number;
  risks: RiskSignal[];
  aiAdvice: string;
  aiAdvantage: string;
  aiSuggestion: string;
  dataSource: string;
  dataYear: string;
  isNewMajor: boolean;
  schoolLevel: string;
  schoolNature: string;
  schoolCity: string;
  tuition: string;
  duration: string;
  degree: string;
  rankHistoryRange: [number, number];
  userRank: number;
  conversionMethod: string;
}

interface RiskSignal {
  type: 'rank_rising' | 'plan_reduced' | 'new_major' | 'score_volatility' | 'policy_change';
  level: 'low' | 'medium' | 'high';
  message: string;
  suggestion: string;
}
```

**示例（节选，rush 档首条）**：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "rush": [
      {
        "id": "rush-0",
        "school": "山东大学",
        "major": "计算机科学与技术",
        "tags": ["985", "公办", "济南"],
        "tier": "rush",
        "hitRate": "10-99%",
        "hitRateMin": 10,
        "hitRateMax": 99,
        "risks": [
          {
            "type": "rank_rising",
            "level": "medium",
            "message": "近2年位次上升8%",
            "suggestion": "冲刺档可适当靠前填报"
          },
          {
            "type": "plan_reduced",
            "level": "low",
            "message": "今年招生计划减少15%",
            "suggestion": "竞争增加但位次仍有优势"
          }
        ],
        "aiAdvice": "山东大学计算机科学与技术专业实力强劲，你的位次处于录取区间下沿，建议作为冲刺档填报。",
        "aiAdvantage": "山东大学计算机科学与技术专业与你的选科高度匹配，学科评估优秀。",
        "aiSuggestion": "建议放在冲刺档合适位置",
        "dataSource": "山东省教育招生考试院",
        "dataYear": "2022-2024年",
        "isNewMajor": false,
        "schoolLevel": "985",
        "schoolNature": "公办",
        "schoolCity": "济南",
        "tuition": "5000元/年",
        "duration": "四年",
        "degree": "工学学士",
        "rankHistoryRange": [10048, 14048],
        "userRank": 12048,
        "conversionMethod": "等比例缩放法 + 线性插值法"
      }
    ],
    "stable": [],
    "preserve": [],
    "cushion": []
  }
}
```

#### 阶段一后端实现要点（复刻前端拼装逻辑）

后端需复刻 `getRecommendations` 的完整拼装逻辑，素材硬编码（对齐 `src/data/dynamic/recommendations.json`）：

| 素材 | 来源 | 说明 |
|------|------|------|
| `schoolPool` | 8 所院校 | name/city/level/nature |
| `majorPool` | 10 个专业 | 字符串数组 |
| `tierHitRateRanges` | rush[10,40] / stable[40,75] / preserve[75,95] / cushion[92,99] | 四档命中率区间 |
| `riskTemplates` | 2 条风险模板 | 含 tier/excludeTier/indexMod/indexEquals 触发条件 |
| `aiAdviceTemplates` | 4 条模板 | 含 `{school}`/`{major}` 占位符 |

**关键拼装规则**（必须与前端一致）：

1. 推荐数量常量：`rush=19, stable=12, preserve=14, cushion=5`。
2. 每档通过 `makeRec(tier, index, schoolIdx, majorIdx)` 生成，各档 schoolIdx/majorIdx 偏移：
   - rush: `makeRec('rush', i, i, i)`
   - stable: `makeRec('stable', i, i+1, i+2)`
   - preserve: `makeRec('preserve', i, i+2, i+4)`
   - cushion: `makeRec('cushion', i, i+3, i+6)`
3. `rankBase = round(userRank / 1000) * 1000`；`rankHistoryRange = [rankBase - 2000, rankBase + 2000]`。
4. `hitRateMin = max(hitMin + (index % 5) * 2, 1)`；`hitRateMax = min(hitMax, 99)`。
5. 风险信号：遍历 `riskTemplates`，按 condition（tier 匹配 / excludeTier 排除 / `index % indexMod === indexEquals`）筛选。
6. `isNewMajor = (major === '人工智能' || major === '数据科学与大数据技术')`。
7. `tuition = 5000 + (index % 5) * 1000` 元/年。
8. `degree`：含"工程"或"计算机"→工学学士，否则理学学士。
9. `dataSource = {省名}省教育招生考试院`，省名映射：`{37:'山东', 13:'河北', 43:'湖南'}`。

- 验收：相同 `provinceCode` + `userRank` 输入，后端返回的四档列表与前端 `getRecommendations` **逐字段一致**。

---

### 3.3 【阶段二】GET /api/v1/recommendations/{id} — 推荐项详情

**对齐前端**：当前 `DetailPage.tsx` 从 store 内存中按 id 查找（无独立接口）。阶段二改为后端查询。

#### 请求

```
GET /api/v1/recommendations/{id}
```

**Path 参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 推荐项 ID，如 `rush-0` |

**Query 参数（阶段二，定位历史推荐）**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provinceCode | string | 是 | 省份编码 |
| userRank | number | 是 | 生成时的省位次 |

> 阶段一 ID 由拼装规则确定（`{tier}-{index}`）；阶段二 ID 改为 DB 主键后，需靠 `provinceCode + userRank + 序号` 定位。

#### 响应

```typescript
// data 即 Recommendation（同 §3.2 单条结构）
type RecommendationDetailResponse = Recommendation;
```

#### 阶段二数据表映射

| 字段 | DB 表/列 | 说明 |
|------|---------|------|
| id | recommendation_result.id | 推荐结果主键 |
| school/major | 关联 school_info / major_info | 院校专业关联 |
| tier/hitRate/risks | recommendation_result 列 | 计算结果落库 |
| rankHistoryRange | 关联 score_line 历史 | 近 3 年录取位次区间 |

---

### 3.4 【阶段二/可选】GET /api/v1/config — 静态配置聚合

**对齐前端**：`src/data/static/index.ts` 的 8 个 JSON 聚合。

> 阶段一**不强制**实现（静态数据构建期打包，前端零改动）。阶段二若需动态下发配置（如省份列表变更、选科规则更新），启用本接口。

#### 请求

```
GET /api/v1/config
```

#### 响应

```typescript
interface ConfigResponse {
  provinces: ProvinceConfig[];
  subjects: {
    subjects31: SubjectOption[];
    subjects33: SubjectOption[];
    labels: Record<string, string>;
  };
  weightTemplates: WeightTemplate[];
  tierConfigs: TierConfig[];
  options: {
    schoolLevels: string[];
    schoolNatures: string[];
    economicZones: string[];
    specialIdentities: { value: string; label: string; icon: string }[];
  };
  searchSuggestions: {
    commonMajors: string[];
    commonCities: string[];
  };
  appConfig: {
    maxScore: number;
    rankDeviationThreshold: number;
    totalSteps: number;
    loadingMessages: string[];
    stepNames: string[];
  };
  subjectCoverage: {
    coverageMap3_3: Record<string, number>;
    firstSubjectCoeff3_1_2: Record<string, { base: number; withChemistry: number; withChemistryBiology: number }>;
  };
}

interface ProvinceConfig {
  code: string;
  name: string;
  mode: '3+3' | '3+1+2';
  maxVolunteers: number;
  volunteerUnit: string;
  hasAdjustment: boolean;
  checkLevel: string;
  tip: string;
}
// 其余 interface 见 src/types/common.ts
```

---

### 3.5 【阶段二】GET /api/v1/schools/{code} — 院校详情

**对齐架构书**：Catalog Service（§1.2），院校信息只读。

#### 请求

```
GET /api/v1/schools/{code}
```

#### 响应

```typescript
interface SchoolDetail {
  code: string;
  name: string;
  city: string;
  level: string;          // 985/211/双一流/普通本科/民办本科/独立学院
  nature: string;         // 公办/民办/中外合作
  province: string;
  tags: string[];
  // 阶段二扩展
  intro?: string;
  employmentRate?: number;
}
```

---

### 3.6 【阶段二】GET /api/v1/majors/{code} — 专业详情

#### 请求

```
GET /api/v1/majors/{code}
```

#### 响应

```typescript
interface MajorDetail {
  code: string;
  name: string;
  category: string;       // 学科门类
  degree: string;         // 授予学位
  duration: string;
  intro?: string;
  employmentDirection?: string[];
}
```

---

### 3.7 【阶段二】GET /api/v1/search/suggest — 模糊联想

**对齐前端**：`searchSuggestions.json`（commonMajors/commonCities）+ Step3 搜索式多选。

#### 请求

```
GET /api/v1/search/suggest?q=计算机&type=major
```

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 搜索关键词 |
| type | string | 是 | `major` / `school` / `city` |

#### 响应

```typescript
interface SearchSuggestResponse {
  items: string[];
}
```

> 阶段二由 Elasticsearch 承载（架构书 §5.4，中文分词 + 拼音）；ES 不可用时降级为本地前缀匹配。

---

## 4. 阶段划分与验收标准

### 4.1 阶段一（通路）— 写死数据

**范围**：仅实现 §3.1、§3.2 两个接口。

| 接口 | 数据来源 | 实现方式 |
|------|---------|---------|
| POST /api/v1/score-rank/lookup | 硬编码 `provinceFactor` + 复刻算法 | Controller 内常量计算 |
| POST /api/v1/recommendations/generate | 硬编码 `schoolPool`/`majorPool` 等素材 + 复刻拼装 | Controller/Service 内常量拼装 |

**验收标准**：

1. **算法一致性**：给定相同输入，后端返回结果与前端原 `getScoreRank`/`getRecommendations` 逐字段一致（QA 用相同用例比对）。
2. **前端通路**：前端改为 fetch 调用后，Step1 输入分数→自动反查位次正常显示；Step4 点击"生成推荐方案"→ResultsPage 四档列表正常渲染；DetailPage 详情正常显示。
3. **响应格式**：所有响应符合 `{ code, message, data }`，`code=0` 为成功。
4. **错误处理**：参数缺失/越界返回 `code=1001`；服务异常返回 `code=2001`。
5. **无数据库依赖**：阶段一后端不连接 PostgreSQL，纯内存计算返回。

### 4.2 阶段二（数据库）— 接入 PostgreSQL

**范围**：§3.1、§3.2 改为读 DB；新增 §3.3~§3.7。

| 接口 | 阶段二数据来源 | 数据表映射 |
|------|--------------|-----------|
| POST /api/v1/score-rank/lookup | 读 `score_rank` 表（一分一段表） | `score_rank(province_code, year, category, score, cumulative_count, count_at_score)` |
| POST /api/v1/recommendations/generate | 读 `score_line`/`admission_plan`/`school_info`/`major_info`，推荐引擎计算 | 见架构书 §5.3 |
| GET /api/v1/recommendations/{id} | 读 `recommendation_result` | 推荐结果落库表 |
| GET /api/v1/config | 读 Catalog 表 | province/school/major 配置表 |
| GET /api/v1/schools/{code} | 读 `school_info` | 院校主数据 |
| GET /api/v1/majors/{code} | 读 `major_info` | 专业主数据 |
| GET /api/v1/search/suggest | Elasticsearch | schools/majors 索引 |

**阶段二核心数据表**（对齐架构书 §5.3 + PRD 附录 A）：

| 表名 | 分片键 | 说明 |
|------|--------|------|
| score_rank | province_code | 一分一段表 |
| score_line | province_code | 历年录取分数线 |
| admission_plan | province_code | 招生计划 |
| school_info | province_code | 院校主数据 |
| major_info | province_code | 专业主数据 |
| subject_requirement | province_code | 选科要求 |
| recommendation_result | user_id | 推荐结果（用户维度） |

**验收标准**：

1. §3.1 改为查 `score_rank` 表，结果与阶段一算法结果在合理误差内（真实一分一段表数据为准）。
2. §3.2 改为基于真实录取数据计算，推荐结果含真实院校/专业/位次区间。
3. §3.3 详情接口可独立查询，不再依赖 store 内存。
4. 静态配置接口（§3.4）若启用，前端可移除 `src/data/static/` 的 JSON 打包，改为运行时 fetch（需前端配合改造）。
5. 数据库读写分离：写走主库，读走副本（架构书 §5.2）。

---

## 5. 前端改造要点

### 5.1 阶段一必改文件

| 文件 | 改动 | 说明 |
|------|------|------|
| `src/data/dynamic/index.ts` | `getScoreRank`、`getRecommendations` 由同步函数改为 async fetch | 返回 Promise；删除 JSON import 与本地算法（迁移到后端） |
| `src/hooks/useScoreRankLookup.ts` | `mockScoreRankLookup` 改为 `async`，调用 fetch | Hook 内 `setTimeout` 模拟延迟改为真实 await |
| `src/store/recommendationStore.ts` | `generateMock` 改为 `async` | `setRecommendations` 改为 await fetch 后 set |
| `src/pages/Step4Confirm.tsx` | `handleGenerate` 改为 async/await | 保持 Loading 态与跳转逻辑 |
| `vite.config.ts` | 新增 proxy 配置 | 见 §5.2 |

### 5.2 Vite Proxy 配置建议

```typescript
// vite.config.ts
export default defineConfig({
  // ...existing
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // 后端地址（待确认端口，见 Q-01）
        changeOrigin: true,
      },
    },
  },
});
```

### 5.3 改造示例（核心代码）

**`src/data/dynamic/index.ts`（阶段一改造后）**：

```typescript
import type {
  TierRecommendations,
} from '@/types/recommendation';
import type { RankLookupResult } from '@/types/form';

const API_BASE = '/api/v1';

/** 分数→位次反查（异步） */
export async function getScoreRank(
  provinceCode: string,
  subjectCategory: 'physics' | 'history' | 'comprehensive',
  score: number,
): Promise<RankLookupResult> {
  const res = await fetch(`${API_BASE}/score-rank/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provinceCode, subjectCategory, score }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}

/** 生成推荐方案（异步） */
export async function getRecommendations(
  provinceCode: string,
  userRank: number,
): Promise<TierRecommendations> {
  const res = await fetch(`${API_BASE}/recommendations/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provinceCode, userRank }),
  });
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.message);
  return json.data;
}
```

**`src/hooks/useScoreRankLookup.ts`（关键改动）**：

```typescript
// mockScoreRankLookup → async lookup
const lookup = useCallback(() => {
  if (!totalScore || !provinceCode || !subjectCategory) return;
  setField('rankLookupStatus', 'loading');
  getScoreRank(provinceCode, subjectCategory as 'physics'|'history'|'comprehensive', totalScore)
    .then((result) => {
      setField('autoRank', result.cumulativeCount);
      setField('provinceRank', result.cumulativeCount);
      setField('rankRange', [result.cumulativeCount - result.countAtScore + 1, result.cumulativeCount]);
      setField('sameScoreCount', result.countAtScore);
      setField('rankLookupStatus', 'success');
    })
    .catch(() => setField('rankLookupStatus', 'error'));
}, [totalScore, provinceCode, subjectCategory, setField]);
```

**`src/store/recommendationStore.ts`（关键改动）**：

```typescript
generateMock: async (provinceCode, userRank) => {
  try {
    const data = await getRecommendations(provinceCode, userRank);
    const totalCount = data.rush.length + data.stable.length + data.preserve.length + data.cushion.length;
    set({ recommendations: data, totalCount, generating: false, generatedAt: new Date().toISOString() });
  } catch (e) {
    set({ generating: false });
    // 错误处理：toast 提示
  }
},
```

> 注：`generateMock` 改为 async 后，`Step4Confirm.handleGenerate` 内 `setTimeout` 可移除，直接 `await generateMock(...)` 后跳转。

### 5.4 阶段一不改文件

- `src/data/static/*`（8 个 JSON）— 保持构建期打包，零改动。
- `src/types/*` — 类型定义不变，后端响应对齐。
- `src/pages/ResultsPage.tsx`、`src/pages/DetailPage.tsx` — 从 store 读数据，不直接调接口，无需改动。

### 5.5 阶段二可选改造

- 若启用 §3.4 配置接口，`src/data/static/index.ts` 改为运行时 fetch（需增加 loading 态与缓存）。
- `src/pages/DetailPage.tsx` 可改为调 §3.3 详情接口，而非从 store 查找（支持刷新页面不丢数据）。

---

## 6. 待确认问题

| 编号 | 问题 | 影响 | 建议决策方 |
|------|------|------|-----------|
| Q-01 | 后端技术栈是否确认为 Java/Spring Boot？监听端口（默认假设 8080）？ | vite proxy target、后端工程搭建 | 技术负责人 |
| Q-02 | 阶段一后端是否需要鉴权？MVP 本地联调建议无鉴权，阶段二再接 JWT | 接口安全设计 | 后端+产品 |
| Q-03 | 推荐生成请求是否扩展接收表单偏好/权重（preferredMajors/weightMode 等）？阶段一 mock 不用，阶段二真实推荐需要 | §3.2 请求体扩展 | 产品+后端 |
| Q-04 | 阶段二推荐生成是否改为异步（Kafka + 轮询/WebSocket）？架构书 §3.5 建议异步，但 MVP 同步更简单 | §3.2 响应方式（同步返回 vs 返回 taskId 轮询） | 产品+架构 |
| Q-05 | 静态配置（§3.4）阶段一是否需要接口化？当前前端打包进 bundle，无接口也能跑 | 前端改动范围 | 产品 |
| Q-06 | `subjectCategory` 的 `comprehensive`（综合类）在真实一分一段表中如何映射？阶段二读 DB 需明确 | §3.1 阶段二查询逻辑 | 后端+数据 |

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 后端复刻算法与前端结果不一致 | 前后端切换后数据跳变，用户困惑 | QA 用相同输入比对；阶段一保留前端 mock 作 fallback 开关 |
| 前端同步改异步引入竞态（位次反查多次触发） | 位次显示错乱 | Hook 内保留 cleanup / AbortController 取消旧请求 |
| 阶段二真实数据与 mock 差异大 | 推荐数量/结构变化 | 接口契约（数量、字段）阶段二保持不变，仅数据源切换 |

---

*增量 PRD V1.0 完成。本文基于前端现有数据契约定义后端 API 接口，分阶段一（通路，写死数据）与阶段二（数据库）落地，确保前端改动最小化。待 Q-01~Q-06 确认后可进入架构设计与实现阶段。*
