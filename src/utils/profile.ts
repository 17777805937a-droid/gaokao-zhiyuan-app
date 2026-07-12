/**
 * 志愿表单 <-> 服务端档案 的序列化工具
 * 只抽取 FormData 中的业务字段（排除向导状态与动作），以 JSONB 存库。
 */

import type { FormData } from '@/types/form';
import { useFormStore } from '@/store/formStore';

/** 需要持久化到云端的表单字段（与 types/form.ts 的 FormData 对齐） */
export const FORM_FIELD_KEYS: (keyof FormData)[] = [
  // Step 1 基础信息
  'provinceCode',
  'subjectCategory',
  'totalScore',
  'provinceRank',
  'autoRank',
  'rankRange',
  'sameScoreCount',
  'rankLookupStatus',
  'fillerRole',
  // Step 2 选科
  'selectedSubjects',
  // Step 3 偏好
  'preferredCategories',
  'preferredMajors',
  'excludedMajors',
  'preferredCities',
  'excludedCities',
  'preferredEconomicZones',
  'preferredLevels',
  'schoolNature',
  'minSchoolLevel',
  'weightMode',
  'schoolWeight',
  'majorWeight',
  'cityWeight',
  'strategyMode',
  'specialIdentity',
  'nationalityBonusPoints',
  'subjectScores',
];

/** 从表单 Store 抽取可持久化字段 */
export function pickFormFields(state: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of FORM_FIELD_KEYS) {
    (out as Record<string, unknown>)[k] = (state as unknown as Record<string, unknown>)[k];
  }
  return out;
}

/**
 * 把服务端档案注水到本地表单 Store（登录后调用）
 * 仅覆盖存在的字段；有数据时才标记 hasDraft，避免清掉本地草稿态。
 */
export function hydrateForm(fields: Record<string, unknown>): void {
  const store = useFormStore.getState();
  for (const k of FORM_FIELD_KEYS) {
    if (Object.prototype.hasOwnProperty.call(fields, k) && (fields as Record<string, unknown>)[k] !== undefined) {
      store.setField(k, (fields as Record<string, unknown>)[k] as never);
    }
  }
  if (fields && Object.keys(fields).length > 0) {
    store.setHasDraft(true);
  }
}
