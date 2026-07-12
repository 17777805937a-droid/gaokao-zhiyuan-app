/**
 * 格式化工具
 */

/** 数字千分位格式化 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/** 百分比格式化 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** 日期格式化（YYYY年M月D日） */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/** 短日期格式（M月D日） */
export function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

/** 权重数组格式化（如 [60, 20, 20] → "60/20/20"） */
export function formatWeights(weights: { school: number; major: number; city: number }): string {
  return `${weights.school}/${weights.major}/${weights.city}`;
}

/** 截断文本 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

/** 获取科目组合文本 */
export function formatSubjects(subjects: string[]): string {
  const labels: Record<string, string> = {
    physics: '物理',
    history: '历史',
    chemistry: '化学',
    biology: '生物',
    geography: '地理',
    politics: '政治',
  };
  return subjects.map((s) => labels[s] ?? s).join('+');
}
