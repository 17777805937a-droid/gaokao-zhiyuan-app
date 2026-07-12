/**
 * 静态配置加载层（薄桶）
 * ------------------------------------------------------------------
 * 所有静态配置集中从 JSON 素材导入并 re-export，业务代码统一经本文件取数。
 * 业务代码请勿直接 import 任意 .json 文件。
 */

import type {
  ProvinceConfig,
  SubjectOption,
  WeightTemplate,
  TierConfig,
} from '@/types/common';

import provincesData from '@/data/static/provinces.json';
import subjectsData from '@/data/static/subjects.json';
import weightTemplatesData from '@/data/static/weightTemplates.json';
import tierConfigsData from '@/data/static/tierConfigs.json';
import optionsData from '@/data/static/options.json';
import searchSuggestionsData from '@/data/static/searchSuggestions.json';
import appConfigData from '@/data/static/appConfig.json';
import subjectCoverageData from '@/data/static/subjectCoverage.json';

/** MVP 试点省份列表 */
export const PROVINCES = provincesData as ProvinceConfig[];

/** 科目列表（3+1+2 模式） */
export const SUBJECTS_3_1_2 = subjectsData.subjects31 as SubjectOption[];

/** 科目列表（3+3 模式） */
export const SUBJECTS_3_3 = subjectsData.subjects33 as SubjectOption[];

/** 科目名称映射 */
export const SUBJECT_LABELS = subjectsData.labels as Record<string, string>;

/** 权重模板列表 */
export const WEIGHT_TEMPLATES = weightTemplatesData as WeightTemplate[];

/** 四档配置 */
export const TIER_CONFIGS = tierConfigsData as TierConfig[];

/** 院校层次选项 */
export const SCHOOL_LEVELS = optionsData.schoolLevels as string[];

/** 院校性质选项 */
export const SCHOOL_NATURES = optionsData.schoolNatures as string[];

/** 经济圈选项 */
export const ECONOMIC_ZONES = optionsData.economicZones as string[];

/** 特殊身份选项 */
export const SPECIAL_IDENTITIES = optionsData.specialIdentities as Array<{
  value: string;
  label: string;
  icon: string;
}>;

/** 常见专业列表（用于搜索联想） */
export const COMMON_MAJORS = searchSuggestionsData.commonMajors as string[];

/** 常见城市列表（用于搜索联想） */
export const COMMON_CITIES = searchSuggestionsData.commonCities as string[];

/** 分数满分 */
export const MAX_SCORE = appConfigData.maxScore as number;

/** 位次偏差阈值（15%） */
export const RANK_DEVIATION_THRESHOLD = appConfigData.rankDeviationThreshold as number;

/** 总步骤数 */
export const TOTAL_STEPS = appConfigData.totalSteps as number;

/** Loading 轮播文案 */
export const LOADING_MESSAGES = appConfigData.loadingMessages as string[];

/** 步骤名称 */
export const STEP_NAMES = appConfigData.stepNames as string[];

/** 选科覆盖率配置（供 subjectRules 计算逻辑读取素材，算法逻辑仍留在代码内） */
export interface SubjectCoverageConfig {
  /** 3+3 模式各科目专业覆盖率 */
  coverageMap3_3: Record<string, number>;
  /** 3+1+2 模式首选科目系数（含化学 / 化学+生物加成） */
  firstSubjectCoeff3_1_2: Record<
    string,
    { base: number; withChemistry: number; withChemistryBiology: number }
  >;
}
export const SUBJECT_COVERAGE = subjectCoverageData as SubjectCoverageConfig;
