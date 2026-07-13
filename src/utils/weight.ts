/**
 * 权重自动平衡工具
 *
 * 三维权重（院校 / 专业 / 城市）之和恒为 100%。
 * 当用户调整其中某一维时，其余两维按各自「当前比例」分摊剩余额度，
 * 保证任意调整后三者之和始终精确等于 100。
 */

export type WeightKey = 'school' | 'major' | 'city';

export interface Weights {
  school: number;
  major: number;
  city: number;
}

const KEYS: WeightKey[] = ['school', 'major', 'city'];

/**
 * 自动平衡权重。
 * @param current 调整前的权重
 * @param changedKey 用户刚调整的维度
 * @param rawValue 用户设定的新值（会自动 clamp 到 0~100）
 * @returns 重新平衡后的权重，三者之和恒为 100
 */
export function rebalanceWeights(
  current: Weights,
  changedKey: WeightKey,
  rawValue: number,
): Weights {
  const newValue = Math.max(0, Math.min(100, Math.round(rawValue)));
  const remaining = 100 - newValue;

  const others = KEYS.filter((k) => k !== changedKey) as [WeightKey, WeightKey];
  const [o1, o2] = others;

  const prev1 = current[o1];
  const prev2 = current[o2];
  const prevSum = prev1 + prev2;

  let val1: number;
  let val2: number;

  if (prevSum === 0) {
    // 其余两维原本都为 0 → 均分剩余额度
    val1 = Math.floor(remaining / 2);
    val2 = remaining - val1;
  } else {
    // 按当前比例分摊
    val1 = Math.round(remaining * (prev1 / prevSum));
    val2 = remaining - val1; // 用减法保证总和精确，避免四舍五入误差
  }

  return {
    ...current,
    [changedKey]: newValue,
    [o1]: val1,
    [o2]: val2,
  };
}

/** 求和（用于展示/兜底校验） */
export function weightSum(w: Weights): number {
  return w.school + w.major + w.city;
}
