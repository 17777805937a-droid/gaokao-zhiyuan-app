/**
 * 表单数据类型定义
 * 字段编号映射 PRD 中的 F-xx / P-xx 编号
 */

/** F-01 省份编码 */
export type ProvinceCode = '37' | '13' | '43';

/** F-02 选科类别 */
export type SubjectCategory = 'physics' | 'history' | 'comprehensive';

/** 考试模式 */
export type ExamMode = '3+3' | '3+1+2';

/** 可选科目 */
export type Subject = 'physics' | 'history' | 'chemistry' | 'biology' | 'geography' | 'politics';

/** F-06 填写者身份 */
export type FillerRole = 'student' | 'parent';

/** 位次反查状态 */
export type RankLookupStatus = 'idle' | 'loading' | 'success' | 'error';

/** P-04 权重模式 */
export type WeightMode = 'school_first' | 'major_first' | 'balanced' | 'custom';

/** P-05 填报策略 */
export type StrategyMode = 'school_priority' | 'major_priority';

/** 权重配置 */
export interface WeightConfig {
  school: number;
  major: number;
  city: number;
}

/** 位次反查结果 */
export interface RankLookupResult {
  cumulativeCount: number;
  countAtScore: number;
}

/** 完整表单数据 */
export interface FormData {
  // —— Step 1 基础信息 ——
  provinceCode: string | null; // F-01
  subjectCategory: string | null; // F-02
  totalScore: number | null; // F-04
  provinceRank: number | null; // F-05
  autoRank: number | null;
  rankRange: [number, number] | null;
  sameScoreCount: number | null;
  rankLookupStatus: RankLookupStatus;
  fillerRole: FillerRole | null; // F-06

  // —— Step 2 选科 ——
  selectedSubjects: string[]; // F-03

  // —— Step 3 偏好 ——
  preferredCategories: string[]; // 倾向学科大类
  preferredMajors: string[]; // 心仪专业
  excludedMajors: string[]; // 专业黑名单
  preferredCities: string[]; // 期望城市
  excludedCities: string[]; // 排斥城市
  preferredEconomicZones: string[]; // 经济圈偏好
  preferredLevels: string[]; // 倾向院校层次
  schoolNature: string[]; // 院校性质
  minSchoolLevel: string; // 最低院校层次
  weightMode: WeightMode; // P-04
  schoolWeight: number;
  majorWeight: number;
  cityWeight: number;
  strategyMode: StrategyMode; // P-05
  specialIdentity: string[]; // F-07
  nationalityBonusPoints: number | null;
  subjectScores: Record<string, number | null>; // F-08
}
