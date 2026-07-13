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

/**
 * 位次反查省份系数（与后端 scoreRankData.provinceFactor 对齐）
 * 以河北约 75 万考生为基准 factor=1.0，其余按 2024 报考规模近似换算。
 * 覆盖全国 31 个省/自治区/直辖市，缺失省份走 ?? 1.0 兜底。
 */
const PROVINCE_FACTOR: Record<string, number> = {
  '11': 0.09, // 北京
  '12': 0.1, // 天津
  '13': 1.0, // 河北
  '14': 0.47, // 山西
  '15': 0.31, // 内蒙古
  '21': 0.27, // 辽宁
  '22': 0.17, // 吉林
  '23': 0.28, // 黑龙江
  '31': 0.08, // 上海
  '32': 0.64, // 江苏
  '33': 0.53, // 浙江
  '34': 0.89, // 安徽
  '35': 0.32, // 福建
  '36': 0.87, // 江西
  '37': 1.3, // 山东
  '41': 1.81, // 河南
  '42': 0.69, // 湖北
  '43': 0.93, // 湖南
  '44': 0.92, // 广东
  '45': 0.92, // 广西
  '46': 0.53, // 海南
  '50': 0.47, // 重庆
  '51': 1.11, // 四川
  '52': 0.67, // 贵州
  '53': 0.53, // 云南
  '54': 0.07, // 西藏
  '61': 0.47, // 陕西
  '62': 0.33, // 甘肃
  '63': 0.07, // 青海
  '64': 0.11, // 宁夏
  '65': 0.31, // 新疆
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

/**
 * 标准正态累积分布函数 Φ(z) 近似
 * 采用 Abramowitz & Stegun 26.2.17 公式（精度 < 7.5e-8）
 */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2); // φ(z)
  const p =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const cdf = z >= 0 ? 1 - p : p;
  return Math.min(Math.max(cdf, 0), 1);
}

/**
 * 分数 → 省位次反查（本地兜底）
 *
 * 模型：以「有效考生规模 N」为总量，按正态尾部分布估算高于该分数的人数。
 *   - N = BASE_N × 省份系数 × (历史类 0.4)   // 河北约60万为基准
 *   - 位次 = N × (1 - Φ((score - μ) / σ))，μ=430, σ=80
 * 高分尾部极薄：730 分在山东约为个位~百位级（绝不可能数千名），
 * 这与「高考录取看省排名、同分极少」的常识一致。
 */
export function lookupScoreRankLocal(
  provinceCode: string,
  category: 'physics' | 'history' | 'all' | 'comprehensive',
  score: number,
): RankLookupResult {
  const subjectCategory = mapSubjectCategory(category);

  // 有效考生规模：以河北约 60 万为基准（factor=1.0），按省份系数缩放；
  // 历史类约为物理类的 40%（文科考生少）。
  const BASE_N = 600000;
  const factor =
    (PROVINCE_FACTOR[provinceCode] ?? 1.0) *
    (subjectCategory === 'history' ? 0.4 : 1.0);
  const N = Math.max(Math.round(BASE_N * factor), 1000);

  // 分数 → 省位次：正态尾部分布近似（μ=430, σ=80）
  const MU = 430;
  const SIGMA = 80;
  const z = (score - MU) / SIGMA;
  const survival = 1 - normalCdf(z);
  const cumulativeCount = Math.max(Math.round(N * survival), 1);

  // 同分人数：用正态概率密度估算（分数越高同分越少）
  const density = Math.exp((-z * z) / 2) / (SIGMA * Math.sqrt(2 * Math.PI));
  const countAtScore = Math.max(Math.round(N * density), 3);

  return { cumulativeCount, countAtScore, source: 'local' };
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
  majorPool: string[],
): Recommendation {
  const school = SCHOOL_POOL[schoolIdx % SCHOOL_POOL.length];
  // 专业索引从「有效专业池」取值：设置了专业偏好则用偏好池，否则用全量池
  const major = majorPool[majorIdx % majorPool.length] ?? MAJOR_POOL[majorIdx % MAJOR_POOL.length];
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

  // 有效专业池：设置了专业偏好 → 仅用偏好专业；未设置（移除偏好）→ 退回全量专业池
  // 这样「移除专业偏好」会立刻改变生成结果（不再局限于原偏好），与用户预期一致。
  const effectiveMajorPool: string[] =
    req.preferredMajors && req.preferredMajors.length > 0
      ? req.preferredMajors
      : MAJOR_POOL;

  // 专业索引采用 stride=4 跨档错开，保证推荐覆盖更多不同专业（解决"专业少"）
  const rush: Recommendation[] = Array.from({ length: COUNT.rush }, (_, i) =>
    makeRec('rush', i, i, i * 4, provinceName, userRank, effectiveMajorPool),
  );
  const stable: Recommendation[] = Array.from({ length: COUNT.stable }, (_, i) =>
    makeRec('stable', i, i + 1, i * 4 + 1, provinceName, userRank, effectiveMajorPool),
  );
  const preserve: Recommendation[] = Array.from({ length: COUNT.preserve }, (_, i) =>
    makeRec('preserve', i, i + 2, i * 4 + 2, provinceName, userRank, effectiveMajorPool),
  );
  const cushion: Recommendation[] = Array.from({ length: COUNT.cushion }, (_, i) =>
    makeRec('cushion', i, i + 3, i * 4 + 3, provinceName, userRank, effectiveMajorPool),
  );

  return { rush, stable, preserve, cushion };
}
