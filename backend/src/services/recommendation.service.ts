/**
 * 推荐生成服务（阶段二：读 PostgreSQL）
 *
 * 院校/专业数据从 DB 读取并缓存到内存，
 * 推荐拼装逻辑（makeRec）与阶段一完全一致。
 * 如果 DB 加载失败，降级到硬编码 schoolPool/majorPool。
 */

import type {
  Tier,
  Recommendation,
  TierRecommendations,
  RiskSignal,
  RecommendationRequest,
} from '@/types/shared.js';
import {
  schoolPool,
  majorPool,
  tierHitRateRanges,
  riskTemplates,
  aiAdviceTemplates,
  PROVINCE_NAMES,
  COUNT,
} from '@/data/recommendationData.js';
import type { SchoolPoolItem } from '@/data/recommendationData.js';
import { pool } from '@/db/pool.js';
import { generateRecommendationsByLLM } from '@/services/llm.service.js';
import { createLogger } from '@/utils/logger.js';

const log = createLogger('Recommendation');

// ============================================================
// 内存缓存（初始化为硬编码数据作为降级兜底）
// ============================================================

let cachedSchools: SchoolPoolItem[] = [...schoolPool];
let cachedMajors: string[] = [...majorPool];

/**
 * 从 DB 加载院校/专业数据到内存缓存
 *
 * 应在服务启动时调用。加载失败时保留硬编码数据，不阻塞启动。
 */
export async function initRecommendationCache(): Promise<void> {
  try {
    const schoolRes = await pool.query(
      `SELECT name, city, level, nature
       FROM school_info
       ORDER BY school_code ASC`,
    );

    if (schoolRes.rows.length > 0) {
      cachedSchools = schoolRes.rows.map((r) => ({
        name: r.name as string,
        city: r.city as string,
        level: r.level as string,
        nature: r.nature as string,
      }));
    }

    const majorRes = await pool.query(
      `SELECT name
       FROM major_info
       ORDER BY major_code ASC`,
    );

    if (majorRes.rows.length > 0) {
      cachedMajors = majorRes.rows.map((r) => r.name as string);
    }

    log.info('推荐缓存加载完成', {
      schools: cachedSchools.length,
      majors: cachedMajors.length,
    });
  } catch (err) {
    log.warn('推荐缓存加载失败，使用硬编码数据降级', { error: (err as Error).message });
    // 保留初始化时的硬编码数据，无需额外操作
  }
}

/**
 * 规则引擎生成推荐结果（降级方案）
 *
 * 拼装逻辑（与前端 getRecommendations 完全一致）：
 * - 数量：rush=19, stable=12, preserve=14, cushion=5
 * - makeRec 偏移：rush(i,i) / stable(i+1,i+2) / preserve(i+2,i+4) / cushion(i+3,i+6)
 * - rankBase = Math.round(userRank / 1000) * 1000
 * - rankHistoryRange = [rankBase - 2000, rankBase + 2000]
 * - hitRateMin = Math.max(hitMin + (index % 5) * 2, 1)
 * - hitRateMax = Math.min(hitMax, 99)
 * - 风险模板筛选：tier 匹配 / excludeTier 排除 / index % indexMod === indexEquals
 * - isNewMajor = (major === '人工智能' || major === '数据科学与大数据技术')
 * - tuition = `${5000 + (index % 5) * 1000}元/年`
 * - degree: 含"工程"或"计算机"→工学学士，否则理学学士
 * - dataSource = `${provinceName}省教育招生考试院`
 *
 * @param provinceCode 省份编码
 * @param userRank 用户位次
 * @returns 四档推荐结果
 */
function generateRecommendationsByRules(
  provinceCode: string,
  userRank: number,
): TierRecommendations {
  const provinceName = PROVINCE_NAMES[provinceCode] ?? '山东';
  const rankBase = Math.round(userRank / 1000) * 1000;

  /**
   * 构造单条推荐（与前端 makeRec 完全一致）
   * 数据源从硬编码改为内存缓存（cachedSchools / cachedMajors）
   */
  function makeRec(
    tier: Tier,
    index: number,
    schoolIdx: number,
    majorIdx: number,
  ): Recommendation {
    const school = cachedSchools[schoolIdx % cachedSchools.length];
    const major = cachedMajors[majorIdx % cachedMajors.length];
    const [hitMin, hitMax] = tierHitRateRanges[tier];
    const offset = (index % 5) * 2;
    const hitRateMin = Math.max(hitMin + offset, 1);
    const hitRateMax = Math.min(hitMax, 99);

    // 风险信号：依据模板条件筛选后拼装
    const risks: RiskSignal[] = riskTemplates
      .filter((tpl) => {
        const c = tpl.condition;
        if (c.tier && tier !== c.tier) return false;
        if (c.excludeTier && tier === c.excludeTier) return false;
        return index % c.indexMod === c.indexEquals;
      })
      .map((tpl) => ({
        type: tpl.type,
        level: tpl.level,
        message: tpl.message,
        suggestion: tpl.suggestion,
      }));

    const hitRateStr = `${hitRateMin}-${hitRateMax}%`;

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
      aiAdvice: aiAdviceTemplates[tier]
        .replace('{school}', school.name)
        .replace('{major}', major),
      aiAdvantage: `${school.name}${major}专业与你的选科高度匹配，学科评估优秀。`,
      aiSuggestion:
        tier === 'stable'
          ? '建议放在稳档前1/3位置（约第8-12个志愿）'
          : `建议放在${
              tier === 'rush' ? '冲刺档' : tier === 'preserve' ? '保底档' : '垫底档'
            }合适位置`,
      dataSource: `${provinceName}省教育招生考试院`,
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

  // 专业索引 stride=4 跨档错开，保证 50 条推荐覆盖更多不同专业
  const rush: Recommendation[] = Array.from({ length: COUNT.rush }, (_, i) =>
    makeRec('rush', i, i, i * 4),
  );
  const stable: Recommendation[] = Array.from({ length: COUNT.stable }, (_, i) =>
    makeRec('stable', i, i + 1, i * 4 + 1),
  );
  const preserve: Recommendation[] = Array.from({ length: COUNT.preserve }, (_, i) =>
    makeRec('preserve', i, i + 2, i * 4 + 2),
  );
  const cushion: Recommendation[] = Array.from({ length: COUNT.cushion }, (_, i) =>
    makeRec('cushion', i, i + 3, i * 4 + 3),
  );

  return { rush, stable, preserve, cushion };
}

/**
 * 生成推荐结果（主入口 —— 先调大模型，失败降级规则引擎）
 *
 * 流程：
 * 1. 调用 DeepSeek 大模型，将用户数据整合成提示词，由大模型生成推荐方案
 * 2. 大模型返回的数据经 llm.service 校验+补全后，包装成 TierRecommendations
 * 3. 如果大模型调用失败 / 解析失败 / 校验失败，降级到规则引擎 generateRecommendationsByRules
 *
 * 降级场景包括：API Key 未配置、网络超时、模型返回格式异常、数量偏差过大等。
 * 降级后返回的数据结构与大模型完全一致，前端无感知。
 *
 * @param req 用户请求数据（含省份、位次、选科、偏好等）
 * @returns 四档推荐结果
 */
export async function generateRecommendations(
  req: RecommendationRequest,
): Promise<TierRecommendations> {
  // —— 第一步：尝试大模型生成 ——
  try {
    const result = await generateRecommendationsByLLM(
      req,
      cachedSchools,
      cachedMajors,
    );
    return result;
  } catch (err) {
    const msg = (err as Error).message;
    log.warn('大模型生成失败，降级到规则引擎', { error: msg });
    // —— 第二步：降级到规则引擎 ——
    return generateRecommendationsByRules(req.provinceCode, req.userRank);
  }
}
