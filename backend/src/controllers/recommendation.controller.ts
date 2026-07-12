/**
 * 推荐生成控制器
 */

import type { Request, Response, NextFunction } from 'express';
import {
  validateProvinceCode,
  validateUserRank,
} from '@/utils/validator.js';
import { generateRecommendations } from '@/services/recommendation.service.js';
import type { RecommendationRequest } from '@/types/shared.js';

/**
 * POST /api/v1/recommendations/generate
 *
 * 请求体（必填）：
 *   - provinceCode: 省份编码
 *   - userRank: 用户位次
 *
 * 请求体（选填，传给大模型生成更精准的推荐）：
 *   - totalScore, selectedSubjects, fillerRole,
 *   - weightMode, schoolWeight, majorWeight, cityWeight,
 *   - strategyMode, preferredMajors, preferredCities, preferredLevels
 *
 * 响应：{ code: 0, message: 'ok', data: { rush, stable, preserve, cushion } }
 *
 * 服务端流程：
 * 1. 校验必填字段（provinceCode / userRank）
 * 2. 整合用户数据为 RecommendationRequest
 * 3. 调用 generateRecommendations（内部先调大模型，失败降级规则引擎）
 * 4. 返回与测试数据结构一致的 TierRecommendations
 */
export async function recommendationGenerate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const provinceCode = validateProvinceCode(req.body?.provinceCode);
    const userRank = validateUserRank(req.body?.userRank);

    // 整合用户数据（选填字段安全提取）
    const request: RecommendationRequest = {
      provinceCode,
      userRank,
      totalScore: req.body?.totalScore ?? null,
      selectedSubjects: req.body?.selectedSubjects ?? [],
      fillerRole: req.body?.fillerRole ?? null,
      weightMode: req.body?.weightMode ?? 'balanced',
      schoolWeight: req.body?.schoolWeight ?? 33,
      majorWeight: req.body?.majorWeight ?? 34,
      cityWeight: req.body?.cityWeight ?? 33,
      strategyMode: req.body?.strategyMode ?? 'school_priority',
      preferredMajors: req.body?.preferredMajors ?? [],
      preferredCities: req.body?.preferredCities ?? [],
      preferredLevels: req.body?.preferredLevels ?? [],
    };

    const result = await generateRecommendations(request);

    res.success(result);
  } catch (err) {
    next(err);
  }
}
