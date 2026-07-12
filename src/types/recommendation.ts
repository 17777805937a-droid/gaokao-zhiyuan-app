/**
 * 推荐结果类型定义
 */

/** 四档类型 */
export type Tier = 'rush' | 'stable' | 'preserve' | 'cushion';

/** 风险信号等级 */
export type RiskLevel = 'low' | 'medium' | 'high';

/** 风险信号类型 */
export type RiskType =
  | 'rank_rising' // 位次上升
  | 'plan_reduced' // 招生计划减少
  | 'new_major' // 新增专业
  | 'score_volatility' // 分数波动
  | 'policy_change'; // 政策变化

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
  // 院校详情
  schoolLevel: string;
  schoolNature: string;
  schoolCity: string;
  tuition: string;
  duration: string;
  degree: string;
  // 计算依据
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

/** 四档 Tab 信息 */
export interface TierInfo {
  key: Tier;
  name: string;
  count: number;
  hitRate: string;
}

/**
 * 推荐生成请求数据 — 发送给后端的完整用户信息
 * 后端将此数据整合成提示词，交给大模型生成推荐
 */
export interface RecommendationRequest {
  /** F-01 省份编码（必填） */
  provinceCode: string;
  /** F-05 省位次（必填） */
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
