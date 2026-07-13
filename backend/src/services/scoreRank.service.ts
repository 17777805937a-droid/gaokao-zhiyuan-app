/**
 * 位次反查服务（阶段二：读 PostgreSQL）
 *
 * 数据来源从硬编码算法改为查询 score_rank 表。
 * 如果 DB 查询失败或未命中，降级到阶段一的硬编码算法，
 * 保证接口返回格式与阶段一完全一致。
 */

import type { SubjectCategory, RankLookupResult } from '@/types/shared.js';
import { provinceFactor } from '@/data/scoreRankData.js';
import { pool } from '@/db/pool.js';
import { createLogger } from '@/utils/logger.js';

const log = createLogger('ScoreRank');

/**
 * 标准正态累积分布函数 Φ(z) 近似（Abramowitz & Stegun 26.2.17）
 */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.319381530 +
      t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const cdf = z >= 0 ? 1 - p : p;
  return Math.min(Math.max(cdf, 0), 1);
}

/**
 * 阶段一硬编码算法（降级用）
 *
 * 模型：以「有效考生规模 N」为总量，按正态尾部分布估算高于该分数的人数。
 *   - N = BASE_N × 省份系数 × (历史类 0.4)，河北约 60 万为基准
 *   - 位次 = N × (1 - Φ((score - μ) / σ))，μ=430, σ=80
 * 高分尾部极薄：730 分在山东约为个位~百位级（绝不可能数千名）。
 */
function fallbackLookup(
  provinceCode: string,
  subjectCategory: SubjectCategory,
  score: number,
): RankLookupResult {
  const BASE_N = 600000;
  const factor =
    (provinceFactor[provinceCode] ?? 1.0) *
    (subjectCategory === 'history' ? 0.4 : 1.0);
  const N = Math.max(Math.round(BASE_N * factor), 1000);

  const MU = 430;
  const SIGMA = 80;
  const z = (score - MU) / SIGMA;
  const cumulativeCount = Math.max(Math.round(N * (1 - normalCdf(z))), 1);

  const density = Math.exp((-z * z) / 2) / (SIGMA * Math.sqrt(2 * Math.PI));
  const countAtScore = Math.max(Math.round(N * density), 3);

  return { cumulativeCount, countAtScore };
}

/**
 * 分数 → 位次反查（异步，读 DB）
 *
 * 查询策略：
 * 1. 先精确匹配 score_rank 表中的分数
 * 2. 精确未命中则在 ±5 分范围内取最近的分数
 * 3. DB 查询失败或无数据时降级到硬编码算法
 *
 * @param provinceCode 省份编码
 * @param subjectCategory 选科类别（physics/history/comprehensive）
 * @param score 高考总分
 * @returns { cumulativeCount, countAtScore }
 */
export async function lookupScoreRank(
  provinceCode: string,
  subjectCategory: SubjectCategory,
  score: number,
): Promise<RankLookupResult> {
  try {
    // 精确匹配
    const exactRes = await pool.query(
      `SELECT cumulative_count, count_at_score
       FROM score_rank
       WHERE province_code = $1 AND category = $2 AND year = 2024 AND score = $3
       LIMIT 1`,
      [provinceCode, subjectCategory, score],
    );

    if (exactRes.rows.length > 0) {
      return {
        cumulativeCount: exactRes.rows[0].cumulative_count,
        countAtScore: exactRes.rows[0].count_at_score,
      };
    }

    // 模糊匹配：±5 分范围内取最近
    const fuzzyRes = await pool.query(
      `SELECT cumulative_count, count_at_score
       FROM score_rank
       WHERE province_code = $1 AND category = $2 AND year = 2024
         AND score BETWEEN $3 - 5 AND $3 + 5
       ORDER BY ABS(score - $3) ASC, score ASC
       LIMIT 1`,
      [provinceCode, subjectCategory, score],
    );

    if (fuzzyRes.rows.length > 0) {
      return {
        cumulativeCount: fuzzyRes.rows[0].cumulative_count,
        countAtScore: fuzzyRes.rows[0].count_at_score,
      };
    }

    // DB 中无匹配数据，降级到硬编码算法
    return fallbackLookup(provinceCode, subjectCategory, score);
  } catch (err) {
    log.warn('DB 查询失败，降级到硬编码算法', { error: (err as Error).message });
    return fallbackLookup(provinceCode, subjectCategory, score);
  }
}
