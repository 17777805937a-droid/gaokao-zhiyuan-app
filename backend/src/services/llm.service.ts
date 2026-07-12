/**
 * DeepSeek 大模型服务
 * ------------------------------------------------------------------
 * 职责：
 * 1. 将用户数据整合成提示词（system + user message）
 * 2. 调用 DeepSeek chat/completions API（OpenAI 兼容接口，JSON mode）
 * 3. 解析大模型返回的 JSON，校验结构，包装成 TierRecommendations
 * 4. 校验失败 / 调用失败时抛出错误，由上层 recommendation.service 降级到规则引擎
 *
 * DeepSeek API 文档：https://api-docs.deepseek.com/
 */

import type {
  Tier,
  Recommendation,
  TierRecommendations,
  RecommendationRequest,
} from '@/types/shared.js';
import type { SchoolPoolItem } from '@/data/recommendationData.js';
import {
  DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL,
  LLM_TIMEOUT,
} from '@/config/env.js';
import {
  PROVINCE_NAMES,
  COUNT,
} from '@/data/recommendationData.js';
import { createLogger } from '@/utils/logger.js';

const log = createLogger('LLM');

// ============================================================
// 常量
// ============================================================

/** 四档中文名 */
const TIER_NAMES: Record<Tier, string> = {
  rush: '冲刺档',
  stable: '稳妥档',
  preserve: '保底档',
  cushion: '垫底档',
};

/** 四档命中率区间（写入提示词，指导大模型生成合理数值） */
const TIER_HIT_RATE_RANGES: Record<Tier, [number, number]> = {
  rush: [10, 40],
  stable: [40, 75],
  preserve: [75, 95],
  cushion: [92, 99],
};

// ============================================================
// 提示词构建
// ============================================================

/**
 * 构建 system message —— 定义角色、输出格式、规则
 */
function buildSystemPrompt(schools: SchoolPoolItem[], majors: string[]): string {
  const schoolList = schools
    .map((s, i) => `${i + 1}. ${s.name}（${s.city}，${s.level}，${s.nature}）`)
    .join('\n');
  const majorList = majors.map((m, i) => `${i + 1}. ${m}`).join('\n');

  return `你是一位资深的高考志愿填报顾问，拥有10年+志愿填报指导经验。请根据考生信息，生成"冲、稳、保、垫"四档志愿推荐方案。

## 院校参考池（必须从以下院校中选择）
${schoolList}

## 专业参考池（必须从以下专业中选择）
${majorList}

## 输出要求
严格输出 JSON 格式，不要包含任何 markdown 标记（如 \`\`\`json）或额外文字。JSON 结构如下：
{
  "rush": [推荐项数组，共${COUNT.rush}条],
  "stable": [推荐项数组，共${COUNT.stable}条],
  "preserve": [推荐项数组，共${COUNT.preserve}条],
  "cushion": [推荐项数组，共${COUNT.cushion}条]
}

每个推荐项的完整结构（所有字段必填）：
{
  "id": "rush-0",
  "school": "山东大学",
  "major": "计算机科学与技术",
  "tags": ["985", "公办", "济南"],
  "tier": "rush",
  "hitRate": "30-40%",
  "hitRateMin": 30,
  "hitRateMax": 40,
  "risks": [{"type": "rank_rising", "level": "medium", "message": "风险描述", "suggestion": "应对建议"}],
  "aiAdvice": "针对性AI建议文案",
  "aiAdvantage": "该院校专业的优势分析",
  "aiSuggestion": "填报位置建议",
  "dataSource": "XX省教育招生考试院",
  "dataYear": "2022-2024年",
  "isNewMajor": false,
  "schoolLevel": "985",
  "schoolNature": "公办",
  "schoolCity": "济南",
  "tuition": "5000元/年",
  "duration": "四年",
  "degree": "工学学士",
  "rankHistoryRange": [33000, 37000],
  "userRank": 35000,
  "conversionMethod": "等比例缩放法 + 线性插值法"
}

## 四档命中率区间（hitRateMin ~ hitRateMax）
- 冲刺档(rush): ${TIER_HIT_RATE_RANGES.rush[0]}%-${TIER_HIT_RATE_RANGES.rush[1]}%
- 稳妥档(stable): ${TIER_HIT_RATE_RANGES.stable[0]}%-${TIER_HIT_RATE_RANGES.stable[1]}%
- 保底档(preserve): ${TIER_HIT_RATE_RANGES.preserve[0]}%-${TIER_HIT_RATE_RANGES.preserve[1]}%
- 垫档(cushion): ${TIER_HIT_RATE_RANGES.cushion[0]}%-${TIER_HIT_RATE_RANGES.cushion[1]}%（必须≥90%）

## 关键规则
1. 每档数量必须严格匹配：rush=${COUNT.rush}条, stable=${COUNT.stable}条, preserve=${COUNT.preserve}条, cushion=${COUNT.cushion}条
2. id 格式为 "档位-序号"，如 rush-0, rush-1, stable-0...
3. tier 字段与所在档位数组一致（rush数组中的项 tier="rush"）
4. tags 为 [院校层次, 办学性质, 所在城市] 三元素数组
5. hitRate 格式为 "min-max%"，hitRateMin/hitRateMax 为对应数字
6. risks 可为空数组 []，有风险时每条含 type/level/message/suggestion 四字段
7. risk.type 可选值: rank_rising, plan_reduced, new_major, score_volatility, policy_change
8. risk.level 可选值: low, medium, high
9. isNewMajor: 人工智能/数据科学与大数据技术 设为 true，其余 false
10. degree: 专业含"工程"或"计算机"为"工学学士"，否则"理学学士"
11. tuition 格式: "XXXX元/年"
12. aiAdvice 要有针对性，结合考生位次和偏好给出个性化建议，不要千篇一律
13. 垫档(cushion)命中率必须≥90%，确保不滑档
14. userRank 和 rankHistoryRange 使用考生实际位次数据`;
}

/**
 * 构建 user message —— 考生信息
 */
function buildUserPrompt(req: RecommendationRequest): string {
  const provinceName = PROVINCE_NAMES[req.provinceCode] ?? '山东';
  const subjects = req.selectedSubjects?.length
    ? req.selectedSubjects.join('、')
    : '未提供';
  const role = req.fillerRole === 'student' ? '考生本人' : req.fillerRole === 'parent' ? '家长' : '未提供';
  const strategy = req.strategyMode === 'school_priority' ? '保院校优先' : req.strategyMode === 'major_priority' ? '保专业优先' : '未提供';
  const prefMajors = req.preferredMajors?.length ? req.preferredMajors.join('、') : '无特殊偏好';
  const prefCities = req.preferredCities?.length ? req.preferredCities.join('、') : '无特殊偏好';
  const prefLevels = req.preferredLevels?.length ? req.preferredLevels.join('、') : '无特殊偏好';

  return `请为以下考生生成四档志愿推荐方案：

## 考生信息
- 省份：${provinceName}（编码 ${req.provinceCode}）
- 高考总分：${req.totalScore ?? '未提供'}分
- 省位次：约第${req.userRank.toLocaleString('zh-CN')}名
- 选科组合：${subjects}
- 填写身份：${role}
- 填报策略：${strategy}
- 权重配置：院校${req.schoolWeight ?? 33}% / 专业${req.majorWeight ?? 34}% / 城市${req.cityWeight ?? 33}%
- 心仪专业：${prefMajors}
- 期望城市：${prefCities}
- 院校层次偏好：${prefLevels}

## 数量要求
- 冲刺档(rush): ${COUNT.rush}条
- 稳妥档(stable): ${COUNT.stable}条
- 保底档(preserve): ${COUNT.preserve}条
- 垫档(cushion): ${COUNT.cushion}条

请严格按照 JSON 格式输出推荐方案。`;
}

// ============================================================
// DeepSeek API 调用
// ============================================================

/** DeepSeek chat/completions 响应结构（仅取需要的字段） */
interface DeepSeekResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

/**
 * 调用 DeepSeek chat/completions API
 *
 * 使用 JSON mode（response_format: { type: "json_object" }）强制返回 JSON。
 * Node.js 18+ 原生 fetch，无需额外依赖。
 */
async function callDeepSeekAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your_deepseek_api_key_here') {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在 backend/.env 中粘贴你的 API Key');
  }

  const url = `${DEEPSEEK_BASE_URL}/chat/completions`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`DeepSeek API 返回 HTTP ${res.status}: ${errText.slice(0, 200)}`);
    }

    const json = (await res.json()) as DeepSeekResponse;

    if (json.error) {
      throw new Error(`DeepSeek API 错误: ${json.error.message ?? '未知错误'}`);
    }

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('DeepSeek API 返回内容为空');
    }

    return content;
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error(`DeepSeek API 请求超时（${LLM_TIMEOUT}ms）`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// 响应解析 + 结构校验
// ============================================================

const VALID_TIERS: Tier[] = ['rush', 'stable', 'preserve', 'cushion'];
const VALID_RISK_TYPES = ['rank_rising', 'plan_reduced', 'new_major', 'score_volatility', 'policy_change'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high'];

/**
 * 将大模型返回的原始内容解析为 TierRecommendations
 *
 * 解析步骤：
 * 1. 去除可能的 markdown 标记（```json ... ```）
 * 2. JSON.parse
 * 3. 逐条校验 + 补全字段
 *
 * 校验失败时抛出错误，由上层降级。
 */
function parseAndValidate(rawContent: string, userRank: number, provinceCode: string): TierRecommendations {
  // 去除 markdown 代码块标记（JSON mode 下一般没有，但做兜底）
  let cleaned = rawContent.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('大模型返回内容无法解析为 JSON');
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('大模型返回 JSON 根节点不是对象');
  }

  const root = parsed as Record<string, unknown>;
  const provinceName = PROVINCE_NAMES[provinceCode] ?? '山东';

  const result: TierRecommendations = { rush: [], stable: [], preserve: [], cushion: [] };

  for (const tier of VALID_TIERS) {
    const arr = root[tier];
    if (!Array.isArray(arr)) {
      throw new Error(`大模型返回缺少 "${tier}" 数组`);
    }

    // 数量校验（允许偏差±2，超出则判失败）
    const expected = COUNT[tier];
    if (Math.abs(arr.length - expected) > 2) {
      throw new Error(`"${tier}" 数量 ${arr.length} 与期望 ${expected} 偏差过大`);
    }

    result[tier] = arr.map((item, idx) => normalizeRecommendation(item, tier, idx, userRank, provinceName));
  }

  return result;
}

/**
 * 校验并补全单条推荐项
 * 缺失的非关键字段用默认值补全，关键字段缺失则抛错。
 */
function normalizeRecommendation(
  item: unknown,
  tier: Tier,
  index: number,
  userRank: number,
  provinceName: string,
): Recommendation {
  if (typeof item !== 'object' || item === null) {
    throw new Error(`${tier}-${index} 不是有效对象`);
  }
  const r = item as Record<string, unknown>;

  // —— 必填字段校验 ——
  const school = typeof r.school === 'string' ? r.school : '';
  const major = typeof r.major === 'string' ? r.major : '';
  if (!school || !major) {
    throw new Error(`${tier}-${index} 缺少 school/major 字段`);
  }

  // —— 命中率 ——
  let hitRateMin = typeof r.hitRateMin === 'number' ? r.hitRateMin : 0;
  let hitRateMax = typeof r.hitRateMax === 'number' ? r.hitRateMax : 0;
  const [rangeMin, rangeMax] = TIER_HIT_RATE_RANGES[tier];
  // 纠正越界值
  hitRateMin = Math.max(rangeMin, Math.min(rangeMax, hitRateMin));
  hitRateMax = Math.max(hitRateMin, Math.min(rangeMax, hitRateMax));

  // —— tags ——
  let tags: string[];
  if (Array.isArray(r.tags)) {
    tags = r.tags.map(String).slice(0, 3);
    while (tags.length < 3) tags.push('');
  } else {
    tags = [];
  }

  // —— risks ——
  let risks: Recommendation['risks'] = [];
  if (Array.isArray(r.risks)) {
    risks = r.risks
      .filter((rk) => typeof rk === 'object' && rk !== null)
      .map((rk) => {
        const rkObj = rk as Record<string, unknown>;
        const type = VALID_RISK_TYPES.includes(rkObj.type as string)
          ? (rkObj.type as Recommendation['risks'][number]['type'])
          : 'score_volatility';
        const level = VALID_RISK_LEVELS.includes(rkObj.level as string)
          ? (rkObj.level as Recommendation['risks'][number]['level'])
          : 'low';
        return {
          type,
          level,
          message: typeof rkObj.message === 'string' ? rkObj.message : '',
          suggestion: typeof rkObj.suggestion === 'string' ? rkObj.suggestion : '',
        };
      });
  }

  // —— rankHistoryRange ——
  let rankHistoryRange: [number, number];
  if (Array.isArray(r.rankHistoryRange) && r.rankHistoryRange.length >= 2) {
    rankHistoryRange = [Number(r.rankHistoryRange[0]) || userRank, Number(r.rankHistoryRange[1]) || userRank];
  } else {
    const base = Math.round(userRank / 1000) * 1000;
    rankHistoryRange = [base - 2000, base + 2000];
  }

  // —— isNewMajor ——
  const isNewMajor =
    typeof r.isNewMajor === 'boolean'
      ? r.isNewMajor
      : major === '人工智能' || major === '数据科学与大数据技术';

  // —— schoolLevel / schoolNature / schoolCity ——
  const schoolLevel = typeof r.schoolLevel === 'string' ? r.schoolLevel : tags[0] ?? '普通本科';
  const schoolNature = typeof r.schoolNature === 'string' ? r.schoolNature : tags[1] ?? '公办';
  const schoolCity = typeof r.schoolCity === 'string' ? r.schoolCity : tags[2] ?? '';

  // —— degree ——
  const degree =
    typeof r.degree === 'string'
      ? r.degree
      : major.includes('工程') || major.includes('计算机')
        ? '工学学士'
        : '理学学士';

  // —— 补全所有字段 ——
  return {
    id: `${tier}-${index}`,
    school,
    major,
    tags: tags.length > 0 ? tags : [schoolLevel, schoolNature, schoolCity],
    tier,
    hitRate: `${hitRateMin}-${hitRateMax}%`,
    hitRateMin,
    hitRateMax,
    risks,
    aiAdvice: typeof r.aiAdvice === 'string' && r.aiAdvice ? r.aiAdvice : `${school}${major}专业适合你当前的位次。`,
    aiAdvantage: typeof r.aiAdvantage === 'string' && r.aiAdvantage ? r.aiAdvantage : `${school}${major}专业与你的选科匹配，学科实力较强。`,
    aiSuggestion: typeof r.aiSuggestion === 'string' && r.aiSuggestion ? r.aiSuggestion : `建议放在${TIER_NAMES[tier]}合适位置。`,
    dataSource: typeof r.dataSource === 'string' && r.dataSource ? r.dataSource : `${provinceName}省教育招生考试院`,
    dataYear: typeof r.dataYear === 'string' && r.dataYear ? r.dataYear : '2022-2024年',
    isNewMajor,
    schoolLevel,
    schoolNature,
    schoolCity,
    tuition: typeof r.tuition === 'string' && r.tuition ? r.tuition : `${5000 + (index % 5) * 1000}元/年`,
    duration: typeof r.duration === 'string' && r.duration ? r.duration : '四年',
    degree,
    rankHistoryRange,
    userRank,
    conversionMethod: typeof r.conversionMethod === 'string' && r.conversionMethod ? r.conversionMethod : '等比例缩放法 + 线性插值法',
  };
}

// ============================================================
// 对外接口
// ============================================================

/**
 * 调用大模型生成推荐方案
 *
 * @param req 用户请求数据（含省份、位次、偏好等）
 * @param schools 院校参考池（从缓存传入）
 * @param majors 专业参考池（从缓存传入）
 * @returns 四档推荐结果（已校验+补全）
 * @throws 调用失败 / 解析失败 / 校验失败时抛出错误
 */
export async function generateRecommendationsByLLM(
  req: RecommendationRequest,
  schools: SchoolPoolItem[],
  majors: string[],
): Promise<TierRecommendations> {
  const systemPrompt = buildSystemPrompt(schools, majors);
  const userPrompt = buildUserPrompt(req);

  log.info('开始调用 DeepSeek API...');
  log.info(`模型: ${DEEPSEEK_MODEL}, 超时: ${LLM_TIMEOUT}ms`);

  const rawContent = await callDeepSeekAPI(systemPrompt, userPrompt);

  log.info(`收到响应，内容长度: ${rawContent.length} 字符`);

  const result = parseAndValidate(rawContent, req.userRank, req.provinceCode);

  const total =
    result.rush.length + result.stable.length + result.preserve.length + result.cushion.length;
  log.info(`解析成功，共 ${total} 条推荐`);

  return result;
}
