/**
 * 推荐生成硬编码数据
 * 复刻自前端 src/data/dynamic/recommendations.json
 */

import type { Tier, RiskType, RiskLevel } from '@/types/shared.js';

/** 院校池单条 */
export interface SchoolPoolItem {
  name: string;
  city: string;
  level: string;
  nature: string;
}

/** 风险信号触发条件 */
export interface RiskCondition {
  tier?: string;
  excludeTier?: string;
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

/** AI 建议文案模板 */
export interface AiAdviceTemplates {
  rush: string;
  stable: string;
  preserve: string;
  cushion: string;
}

/** 院校池（8所） */
export const schoolPool: SchoolPoolItem[] = [
  { name: '山东大学', city: '济南', level: '985', nature: '公办' },
  { name: '中国海洋大学', city: '青岛', level: '985', nature: '公办' },
  { name: '山东师范大学', city: '济南', level: '省重点', nature: '公办' },
  { name: '青岛大学', city: '青岛', level: '省重点', nature: '公办' },
  { name: '济南大学', city: '济南', level: '普通本科', nature: '公办' },
  { name: '山东科技大学', city: '青岛', level: '普通本科', nature: '公办' },
  { name: '山东理工大学', city: '淄博', level: '普通本科', nature: '公办' },
  { name: '烟台大学', city: '烟台', level: '普通本科', nature: '公办' },
];

/** 专业池（40个，覆盖主要学科门类；DB 为空时作为降级兜底） */
export const majorPool: string[] = [
  '计算机科学与技术',
  '人工智能',
  '数据科学与大数据技术',
  '软件工程',
  '网络工程',
  '信息安全',
  '物联网工程',
  '数字媒体技术',
  '电子信息工程',
  '通信工程',
  '微电子科学与工程',
  '光电信息科学与工程',
  '自动化',
  '机器人工程',
  '机械工程',
  '车辆工程',
  '电气工程及其自动化',
  '土木工程',
  '航空航天工程',
  '材料科学与工程',
  '化学工程与工艺',
  '环境科学与工程',
  '生物医学工程',
  '临床医学',
  '口腔医学',
  '药学',
  '预防医学',
  '数学与应用数学',
  '物理学',
  '应用化学',
  '生物科学',
  '心理学',
  '经济学',
  '金融学',
  '国际经济与贸易',
  '会计学',
  '工商管理',
  '财务管理',
  '法学',
  '汉语言文学',
  '新闻传播学',
  '英语',
  '历史学',
  '哲学',
  '建筑学',
  '城乡规划',
  '风景园林',
  '视觉传达设计',
];

/** 四档命中率区间 */
export const tierHitRateRanges: TierHitRateRanges = {
  rush: [10, 40],
  stable: [40, 75],
  preserve: [75, 95],
  cushion: [92, 99],
};

/** 风险信号模板（2条） */
export const riskTemplates: RiskTemplate[] = [
  {
    type: 'rank_rising',
    level: 'medium',
    message: '近2年位次上升8%',
    suggestion: '冲刺档可适当靠前填报',
    condition: { tier: 'rush', indexMod: 2, indexEquals: 0 },
  },
  {
    type: 'plan_reduced',
    level: 'low',
    message: '今年招生计划减少15%',
    suggestion: '竞争增加但位次仍有优势',
    condition: { excludeTier: 'cushion', indexMod: 3, indexEquals: 0 },
  },
];

/** AI 建议文案模板（4条，含 {school}/{major} 占位符） */
export const aiAdviceTemplates: AiAdviceTemplates = {
  rush: '{school}{major}专业实力强劲，你的位次处于录取区间下沿，建议作为冲刺档填报。',
  stable: '{school}{major}专业与你的选科高度匹配，建议放在稳档前1/3位置。',
  preserve: '{school}{major}录取把握较大，建议作为保底档的核心选择。',
  cushion: '{school}{major}录取几乎确定，作为垫底保障确保不滑档。',
};

/** 省份编码 → 省份名（用于拼接 dataSource 文案） */
export const PROVINCE_NAMES: Record<string, string> = {
  '37': '山东',
  '13': '河北',
  '43': '湖南',
};

/** 推荐数量常量 */
export const COUNT: Record<Tier, number> = {
  rush: 19,
  stable: 12,
  preserve: 14,
  cushion: 5,
};
