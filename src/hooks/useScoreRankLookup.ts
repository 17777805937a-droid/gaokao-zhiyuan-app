/**
 * 分数→位次反查 Hook
 * 对接后端 API（异步），数据已迁移至后端服务。
 */

import { useEffect, useCallback } from 'react';
import { useFormStore } from '@/store/formStore';
import type { RankLookupResult } from '@/types/form';
import type { TierRecommendations, RecommendationRequest } from '@/types/recommendation';
import { getScoreRank, getRecommendationsWithRetry } from '@/data/dynamic';

/**
 * 位次反查（异步，调用后端 API）
 *
 * @param provinceCode 省份编码
 * @param subjectCategory 选科类别
 * @param score 高考总分
 * @returns Promise<RankLookupResult | null>
 */
export async function mockScoreRankLookup(
  provinceCode: string,
  subjectCategory: string,
  score: number,
): Promise<RankLookupResult | null> {
  try {
    const result = await getScoreRank(
      provinceCode,
      subjectCategory as 'physics' | 'history' | 'all',
      score,
    );
    return result;
  } catch {
    return null;
  }
}

/**
 * 分数→位次反查 Hook
 * 监听分数、省份、科目类别变化，自动触发反查
 */
export function useScoreRankLookup() {
  const { totalScore, provinceCode, subjectCategory } = useFormStore();
  const setField = useFormStore((s) => s.setField);

  const lookup = useCallback(() => {
    if (!totalScore || !provinceCode) {
      return;
    }
    // subjectCategory 为 null 时默认 comprehensive（兼容 3+3 模式未显式设置的场景）
    const effectiveCategory = subjectCategory ?? 'comprehensive';

    setField('rankLookupStatus', 'loading');

    // 调用后端 API（异步），失败时本地兜底引擎自动接管
    mockScoreRankLookup(provinceCode, effectiveCategory, totalScore)
      .then((result) => {
        if (result) {
          setField('autoRank', result.cumulativeCount);
          setField('provinceRank', result.cumulativeCount);
          setField('rankRange', [result.cumulativeCount - result.countAtScore + 1, result.cumulativeCount]);
          setField('sameScoreCount', result.countAtScore);
          setField('rankSource', result.source ?? null);
          setField('rankLookupStatus', 'success');
        } else {
          setField('rankLookupStatus', 'error');
        }
      })
      .catch(() => {
        setField('rankLookupStatus', 'error');
      });
  }, [totalScore, provinceCode, subjectCategory, setField]);

  // 手动触发反查
  const triggerLookup = useCallback(() => {
    lookup();
  }, [lookup]);

  // 分数/省份变化时自动反查
  useEffect(() => {
    lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScore, provinceCode, subjectCategory, setField]);

  return { triggerLookup };
}

/**
 * 生成推荐数据（异步，调用后端 API）
 *
 * 将完整用户数据发送给后端，后端整合成提示词交由大模型处理，
 * 大模型返回的数据包装成 TierRecommendations 结构后返回。
 */
export async function generateMockRecommendations(
  req: RecommendationRequest,
): Promise<TierRecommendations> {
  return getRecommendationsWithRetry(req);
}
