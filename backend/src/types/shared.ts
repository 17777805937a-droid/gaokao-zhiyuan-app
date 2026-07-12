/**
 * 共享类型定义（复制自前端 src/types/）
 * 前后端保持类型一致，确保数据契约对齐
 */

/** 四档类型 */
export type Tier = 'rush' | 'stable' | 'preserve' | 'cushion';

/** 风险信号等级 */
export type RiskLevel = 'low' | 'medium' | 'high';

/** 风险信号类型 */
export type RiskType =
  | 'rank_rising'
  | 'plan_reduced'
  | 'new_major'
  | 'score_volatility'
  | 'policy_change';

/** 风险信号 */
export interface RiskSignal {
  type: RiskType;
  level: RiskLevel;
  message: string;
  suggestion: string;
}

/** 推荐结果项 */
export interface Recommendation {
  id: string;
  school: string;
  major: string;
  tags: string[];
  tier: Tier;
  hitRate: string;
  hitRateMin: number;
  hitRateMax: number;
  risks: RiskSignal[];
  aiAdvice: string;
  aiAdvantage: string;
  aiSuggestion: string;
  dataSource: string;
  dataYear: string;
  isNewMajor: boolean;
  schoolLevel: string;
  schoolNature: string;
  schoolCity: string;
  tuition: string;
  duration: string;
  degree: string;
  rankHistoryRange: [number, number];
  userRank: number;
  conversionMethod: string;
}

/** 四档数据集合 */
export interface TierRecommendations {
  rush: Recommendation[];
  stable: Recommendation[];
  preserve: Recommendation[];
  cushion: Recommendation[];
}

/** 位次反查结果 */
export interface RankLookupResult {
  cumulativeCount: number;
  countAtScore: number;
}

/** 选科类别 */
export type SubjectCategory = 'physics' | 'history' | 'comprehensive';

// ============================================================
// 推荐生成请求（扩展用户信息，供大模型生成推荐使用）
// ============================================================

/** 推荐生成请求数据 — 包含考生基础信息 + 偏好设置 */
export interface RecommendationRequest {
  /** F-01 省份编码 */
  provinceCode: string;
  /** F-05 省位次 */
  userRank: number;
  /** F-04 高考总分 */
  totalScore?: number | null;
  /** F-03 选科组合 */
  selectedSubjects?: string[];
  /** F-06 填写者身份 */
  fillerRole?: string | null;
  /** P-04 权重模式 */
  weightMode?: string;
  /** 院校权重 */
  schoolWeight?: number;
  /** 专业权重 */
  majorWeight?: number;
  /** 城市权重 */
  cityWeight?: number;
  /** P-05 填报策略 */
  strategyMode?: string;
  /** 心仪专业 */
  preferredMajors?: string[];
  /** 期望城市 */
  preferredCities?: string[];
  /** 倾向院校层次 */
  preferredLevels?: string[];
}
