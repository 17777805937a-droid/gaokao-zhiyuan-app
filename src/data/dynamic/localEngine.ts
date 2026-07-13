/**
 * 本地兜底引擎（离线可用）
 * ------------------------------------------------------------------
 * 当后端（Railway）不可达 / 休眠 / 报错时，在浏览器内直接完成：
 *   1. 分数 → 位次反查（lookupScoreRankLocal）
 *   2. 四档推荐方案生成（generateRecommendationsLocally）
 *
 * 设计目标：保证核心填报流程在「任何网络状态下」都能跑通，
 * 后端仅作为「增强层」（真实大模型 / 数据库），缺失时不影响主流程。
 *
 * 算法与后端 recommendation.service.ts / scoreRank.service.ts 的规则引擎
 * 完全一致，确保后端可用与否，用户看到的结果结构、字段都对齐。
 */

import type {
  Tier,
  Recommendation,
  TierRecommendations,
  RiskSignal,
  RecommendationRequest,
} from '@/types/recommendation';
import type { RankLookupResult } from '@/types/form';
import { COMMON_MAJORS, PROVINCES } from '@/data/static';

// ============================================================
// 本地静态数据（与后端 schoolPool / majorPool / 种子数据对齐）
// ============================================================

/** 院校池（8所，对齐后端 schoolPool / DB school_info） */
const SCHOOL_POOL: ReadonlyArray<{
  name: string;
  city: string;
  level: string;
  nature: string;
}> = [
  { name: '山东大学', city: '济南', level: '985', nature: '公办' },
  { name: '中国海洋大学', city: '青岛', level: '985', nature: '公办' },
  { name: '山东师范大学', city: '济南', level: '省重点', nature: '公办' },
  { name: '青岛大学', city: '青岛', level: '省重点', nature: '公办' },
  { name: '济南大学', city: '济南', level: '普通本科', nature: '公办' },
  { name: '山东科技大学', city: '青岛', level: '普通本科', nature: '公办' },
  { name: '山东理工大学', city: '淄博', level: '普通本科', nature: '公办' },
  { name: '烟台大学', city: '烟台', level: '普通本科', nature: '公办' },
];

/**
 * 专业池：直接复用前端 114 个常见专业，
 * 保证推荐结果专业丰富（解决「专业只有6个 / 10个」的问题）。
 */
const MAJOR_POOL: string[] = COMMON_MAJORS;

/** 四档命中率区间 */
const TIER_HIT_RATE_RANGES: Record<Tier, [number, number]> = {
  rush: [10, 40],
  stable: [40, 75],
  preserve: [75, 95],
  cushion: [92, 99],
};

/** 风险信号模板（2条） */
const RISK_TEMPLATES: ReadonlyArray<{
  type: 'rank_rising' | 'plan_reduced';
  level: 'medium' | 'low';
  message: string;
  suggestion: string;
  condition: { tier?: Tier; excludeTier?: Tier; indexMod: number; indexEquals: number };
}> = [
  {
    type: 'rank_rising',
    level: 'medium',
    message: '近2年位次上升8%',
    suggestion: '冲刺档可适当靠前填报',
    condition: { tier: 'rush', indexMod: 2, indexEquals: 0 },
  },
  {
    type: 'plan_reduced',
    level: 'low',
    message: '今年招生计划减少15%',
    suggestion: '竞争增加但位次仍有优势',
    condition: { excludeTier: 'cushion', indexMod: 3, indexEquals: 0 },
  },
];

/** AI 建议文案模板（4条，含 {school}/{major} 占位符） */
const AI_ADVICE_TEMPLATES: Record<Tier, string> = {
  rush: '{school}{major}专业实力强劲，你的位次处于录取区间下沿，建议作为冲刺档填报。',
  stable: '{school}{major}专业与你的选科高度匹配，建议放在稳档前1/3位置。',
  preserve: '{school}{major}录取把握较大，建议作为保底档的核心选择。',
  cushion: '{school}{major}录取几乎确定，作为垫底保障确保不滑档。',
};

/** 推荐数量常量 */
const COUNT: Record<Tier, number> = {
  rush: 19,
  stable: 12,
  preserve: 14,
  cushion: 5,
};

/** 省份编码 → 省份名（用于拼接 dataSource 文案） */
const PROVINCE_NAMES: Record<string, string> = {};
PROVINCES.forEach((p) => {
  PROVINCE_NAMES[p.code] = p.name;
});

/** 位次反查省份系数（与后端 scoreRankData.provinceFactor 对齐） */
const PROVINCE_FACTOR: Record<string, number> = {
  '37': 1.2, // 山东
  '13': 1.0, // 河北
  '43': 0.9, // 湖南
};

// ============================================================
// 工具函数
// ============================================================

/** 前端 'all' / 'comprehensive' → 后端 'comprehensive' */
function mapSubjectCategory(
  category: string,
): 'physics' | 'history' | 'comprehensive' {
  if (category === 'all' || category === 'comprehensive') return 'comprehensive';
  return category as 'physics' | 'history';
}

// ============================================================
// 1. 分数 → 位次反查（本地公式，对齐后端 fallbackLookup）
// ============================================================

export function lookupScoreRankLocal(
  provinceCode: string,
  category: 'physics' | 'history' | 'all' | 'comprehensive',
  score: number,
): RankLookupResult {
  const subjectCategory = mapSubjectCategory(category);

  const factor =
    (PROVINCE_FACTOR[provinceCode] ?? 1.0) *
    (subjectCategory === 'history' ? 0.4 : 1.0);

  const baseRank = Math.round((750 - score) * (80 + score * 0.08) * factor);
  const cumulativeCount = Math.max(baseRank, 1);
  const countAtScore = Math.max(Math.round(50 - (750 - score) * 0.06), 5);

  return { cumulativeCount, countAtScore };
}

// ============================================================
// 2. 推荐生成（本地规则引擎，对齐后端 generateRecommendationsByRules）
// ============================================================

function makeRec(
  tier: Tier,
  index: number,
  schoolIdx: number,
  majorIdx: number,
  provinceName: string,
  userRank: number,
): Recommendation {
  const school = SCHOOL_POOL[schoolIdx % SCHOOL_POOL.length];
  const major = MAJOR_POOL[majorIdx % MAJOR_POOL.length];
  const [hitMin, hitMax] = TIER_HIT_RATE_RANGES[tier];
  const offset = (index % 5) * 2;
  const hitRateMin = Math.max(hitMin + offset, 1);
  const hitRateMax = Math.min(hitMax, 99);

  // 风险信号：依据模板条件筛选后拼装
  const risks: RiskSignal[] = RISK_TEMPLATES.filter((tpl) => {
    const c = tpl.condition;
    if (c.tier && tier !== c.tier) return false;
    if (c.excludeTier && tier === c.excludeTier) return false;
    return index % c.indexMod === c.indexEquals;
  }).map((tpl) => ({
    type: tpl.type,
    level: tpl.level,
    message: tpl.message,
    suggestion: tpl.suggestion,
  }));

  const hitRateStr = `${hitRateMin}-${hitRateMax}%`;
  const rankBase = Math.round(userRank / 1000) * 1000;

  return {
    id: `${tier}-${index}`,
    school: school.name,
    major,
    tags: [school.level, school.nature, school.city],
    tier,
    hitRate: hitRateStr,
    hitRateMin,
    hitRateMax,
    risks,
    aiAdvice: AI_ADVICE_TEMPLATES[tier]
      .replace('{school}', school.name)
      .replace('{major}', major),
    aiAdvantage: `${school.name}${major}专业与你的选科高度匹配，学科评估优秀。`,
    aiSuggestion:
      tier === 'stable'
        ? '建议放在稳档前1/3位置（约第8-12个志愿）'
        : `建议放在${
            tier === 'rush' ? '冲刺档' : tier === 'preserve' ? '保底档' : '垫底档'
          }合适位置`,
    dataSource: `${provinceName}省教育招生考试院（本地估算）`,
    dataYear: '2022-2024年',
    isNewMajor: major === '人工智能' || major === '数据科学与大数据技术',
    schoolLevel: school.level,
    schoolNature: school.nature,
    schoolCity: school.city,
    tuition: `${5000 + (index % 5) * 1000}元/年`,
    duration: '四年',
    degree: major.includes('工程') || major.includes('计算机') ? '工学学士' : '理学学士',
    rankHistoryRange: [rankBase - 2000, rankBase + 2000],
    userRank,
    conversionMethod: '等比例缩放法 + 线性插值法',
  };
}

export function generateRecommendationsLocally(
  req: RecommendationRequest,
): TierRecommendations {
  const provinceName = PROVINCE_NAMES[req.provinceCode] ?? '山东';
  const userRank = req.userRank ?? 50000;

  // 专业索引采用 stride=4 跨档错开，保证 50 条推荐覆盖 50 个不同专业（解决"专业少"）
  const rush: Recommendation[] = Array.from({ length: COUNT.rush }, (_, i) =>
    makeRec('rush', i, i, i * 4, provinceName, userRank),
  );
  const stable: Recommendation[] = Array.from({ length: COUNT.stable }, (_, i) =>
    makeRec('stable', i, i + 1, i * 4 + 1, provinceName, userRank),
  );
  const preserve: Recommendation[] = Array.from({ length: COUNT.preserve }, (_, i) =>
    makeRec('preserve', i, i + 2, i * 4 + 2, provinceName, userRank),
  );
  const cushion: Recommendation[] = Array.from({ length: COUNT.cushion }, (_, i) =>
    makeRec('cushion', i, i + 3, i * 4 + 3, provinceName, userRank),
  );

  return { rush, stable, preserve, cushion };
}
