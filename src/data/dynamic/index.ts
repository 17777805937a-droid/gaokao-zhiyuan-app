/**
 * 动态数据加载层（对接后端 API）
 * ------------------------------------------------------------------
 * 阶段一：通过 fetch 调用后端 /api/v1 接口，后端返回硬编码数据。
 * 业务代码请勿直接 import 任意 .json 文件，统一经本文件取数；
 * Hook 层（useScoreRankLookup）仅保留算法与 React 交互，调用本文件的契约函数。
 */

import type {
  Tier,
  RiskType,
  RiskLevel,
  Recommendation,
  TierRecommendations,
  RecommendationRequest,
} from '@/types/recommendation';
import type { RankLookupResult } from '@/types/form';
import type { ApiResponse } from '@/types/common';

/** 分数→位次：省份系数表（保留接口定义，数据已迁移至后端） */
export interface ScoreRankMockData {
  provinceFactor: Record<string, number>;
}

/** 院校池单条 */
export interface SchoolPoolItem {
  name: string;
  city: string;
  level: string;
  nature: string;
}

/** 风险信号触发条件（逻辑参数，配合风险模板使用） */
export interface RiskCondition {
  /** 仅在某档触发 */
  tier?: string;
  /** 排除某档 */
  excludeTier?: string;
  /** index % indexMod === indexEquals 时命中 */
  indexMod: number;
  indexEquals: number;
}

/** 风险信号模板 */
export interface RiskTemplate {
  type: RiskType;
  level: RiskLevel;
  message: string;
  suggestion: string;
  condition: RiskCondition;
}

/** 四档命中率区间 */
export interface TierHitRateRanges {
  rush: [number, number];
  stable: [number, number];
  preserve: [number, number];
  cushion: [number, number];
}

/** AI 建议文案模板（含 {school}/{major} 占位符，拼装逻辑在后端） */
export interface AiAdviceTemplates {
  rush: string;
  stable: string;
  preserve: string;
  cushion: string;
}

/** 推荐数据契约（数据已迁移至后端） */
export interface RecommendationsMockData {
  schoolPool: SchoolPoolItem[];
  majorPool: string[];
  tierHitRateRanges: TierHitRateRanges;
  riskTemplates: RiskTemplate[];
  aiAdviceTemplates: AiAdviceTemplates;
}

/** 选科类别映射：前端 'all' → 后端 'comprehensive' */
function mapSubjectCategory(category: string): string {
  if (category === 'all') return 'comprehensive';
  return category;
}

/**
 * 分数 → 位次反查（异步，调用后端 API）
 *
 * @param provinceCode 省份编码
 * @param category 选科类别（physics/history/all，内部映射为后端值）
 * @param score 高考总分
 * @returns { cumulativeCount, countAtScore }
 */
export async function getScoreRank(
  provinceCode: string,
  category: 'physics' | 'history' | 'all',
  score: number,
): Promise<RankLookupResult> {
  const subjectCategory = mapSubjectCategory(category);

  const res = await fetch('/api/v1/score-rank/lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provinceCode, subjectCategory, score }),
  });

  const json: ApiResponse<RankLookupResult> = await res.json();
  if (json.code !== 0 || !json.data) {
    throw new Error(json.message || '位次反查失败');
  }
  return json.data;
}

/**
 * 生成推荐结果（异步，调用后端 API）
 *
 * 将完整用户数据发送给后端，后端整合成提示词交由大模型处理，
 * 大模型返回的数据包装成 TierRecommendations 结构后返回。
 * 客户端在等待响应期间播放 LoadingOverlay 动画。
 *
 * @param req 用户请求数据（含省份、位次、选科、偏好等）
 * @returns 四档推荐结果
 */
export async function getRecommendations(
  req: RecommendationRequest,
): Promise<TierRecommendations> {
  const res = await fetch('/api/v1/recommendations/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  const json: ApiResponse<TierRecommendations> = await res.json();
  if (json.code !== 0 || !json.data) {
    throw new Error(json.message || '推荐生成失败');
  }
  return json.data;
}

/** 保留类型导出，避免其他文件引用报错 */
export type { Tier, Recommendation, TierRecommendations, RecommendationRequest };
