/**
 * 位次反查控制器
 */

import type { Request, Response, NextFunction } from 'express';
import { BusinessException } from '@/types/index.js';
import {
  validateProvinceCode,
  validateSubjectCategory,
  validateScore,
} from '@/utils/validator.js';
import { lookupScoreRank } from '@/services/scoreRank.service.js';

/**
 * POST /api/v1/score-rank/lookup
 * 请求体：{ provinceCode, subjectCategory, score }
 * 响应：{ code: 0, message: 'ok', data: { cumulativeCount, countAtScore } }
 */
export async function scoreRankLookup(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const provinceCode = validateProvinceCode(req.body?.provinceCode);
    const subjectCategory = validateSubjectCategory(req.body?.subjectCategory);
    const score = validateScore(req.body?.score);

    const result = await lookupScoreRank(provinceCode, subjectCategory, score);

    res.success(result);
  } catch (err) {
    next(err);
  }
}
