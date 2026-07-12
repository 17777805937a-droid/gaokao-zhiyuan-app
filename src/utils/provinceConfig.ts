/**
 * 省份配置工具
 * 3+3 / 3+1+2 模式映射、志愿数、投档规则
 */

import { PROVINCES } from '@/config/constants';
import type { ProvinceConfig } from '@/types/common';

/** 获取省份配置 */
export function getProvinceConfig(provinceCode: string): ProvinceConfig | undefined {
  return PROVINCES.find((p) => p.code === provinceCode);
}

/** 获取省份名称 */
export function getProvinceName(provinceCode: string): string {
  return getProvinceConfig(provinceCode)?.name ?? '';
}

/** 获取考试模式 */
export function getExamMode(provinceCode: string): '3+3' | '3+1+2' | null {
  const config = getProvinceConfig(provinceCode);
  return config ? config.mode : null;
}

/** 获取最大志愿数 */
export function getMaxVolunteers(provinceCode: string): number {
  return getProvinceConfig(provinceCode)?.maxVolunteers ?? 0;
}

/** 获取省份提示文案 */
export function getProvinceTip(provinceCode: string): string {
  return getProvinceConfig(provinceCode)?.tip ?? '';
}

/** 获取志愿单位描述 */
export function getVolunteerUnitDesc(provinceCode: string): string {
  const config = getProvinceConfig(provinceCode);
  if (!config) return '';
  return config.volunteerUnit === 'major+school' ? '专业+院校' : '院校专业组';
}

/** 是否需要服从调剂 */
export function hasAdjustment(provinceCode: string): boolean {
  return getProvinceConfig(provinceCode)?.hasAdjustment ?? false;
}

/** 获取默认选科类别（3+3 模式自动设为 comprehensive） */
export function getDefaultSubjectCategory(provinceCode: string): string | null {
  const mode = getExamMode(provinceCode);
  if (mode === '3+3') return 'comprehensive';
  return null;
}
