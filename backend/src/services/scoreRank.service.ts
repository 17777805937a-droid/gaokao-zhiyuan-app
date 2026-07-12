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
 * 阶段一硬编码算法（降级用）
 *
 * factor = provinceFactor[provinceCode] (默认1.0) * (subjectCategory === 'history' ? 0.4 : 1.0)
 * baseRank = Math.round((750 - score) * (80 + score * 0.08) * factor)
 * cumulativeCount = Math.max(baseRank, 1)
 * countAtScore = Math.max(Math.round(50 - (750 - score) * 0.06), 5)
 */
function fallbackLookup(
  provinceCode: string,
  subjectCategory: SubjectCategory,
  score: number,
): RankLookupResult {
  const factor =
    (provinceFactor[provinceCode] ?? 1.0) *
    (subjectCategory === 'history' ? 0.4 : 1.0);

  const baseRank = Math.round((750 - score) * (80 + score * 0.08) * factor);
  const cumulativeCount = Math.max(baseRank, 1);
  const countAtScore = Math.max(Math.round(50 - (750 - score) * 0.06), 5);

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
