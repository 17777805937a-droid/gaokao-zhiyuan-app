/**
 * 请求参数校验工具
 */

import { BusinessException, ErrorCode } from '@/types/index.js';

/** 校验省份编码 */
export function validateProvinceCode(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BusinessException(ErrorCode.PARAM_ERROR, 'provinceCode 不能为空');
  }
  return value.trim();
}

/** 校验选科类别 */
export function validateSubjectCategory(value: unknown): 'physics' | 'history' | 'comprehensive' {
  if (typeof value !== 'string') {
    throw new BusinessException(ErrorCode.PARAM_ERROR, 'subjectCategory 不能为空');
  }
  const valid: string[] = ['physics', 'history', 'comprehensive'];
  if (!valid.includes(value)) {
    throw new BusinessException(
      ErrorCode.PARAM_ERROR,
      `subjectCategory 无效，允许值: ${valid.join(', ')}`,
    );
  }
  return value as 'physics' | 'history' | 'comprehensive';
}

/** 校验分数 */
export function validateScore(value: unknown): number {
  const score = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof score !== 'number' || isNaN(score)) {
    throw new BusinessException(ErrorCode.PARAM_ERROR, 'score 必须是数字');
  }
  if (score < 0 || score > 750) {
    throw new BusinessException(ErrorCode.PARAM_ERROR, 'score 范围应在 0-750 之间');
  }
  return score;
}

/** 校验位次 */
export function validateUserRank(value: unknown): number {
  const rank = typeof value === 'string' ? parseInt(value, 10) : value;
  if (typeof rank !== 'number' || isNaN(rank)) {
    throw new BusinessException(ErrorCode.PARAM_ERROR, 'userRank 必须是数字');
  }
  if (rank < 1) {
    throw new BusinessException(ErrorCode.PARAM_ERROR, 'userRank 应大于 0');
  }
  return rank;
}

/** 校验邮箱格式 */
export function validateEmail(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BusinessException(ErrorCode.PARAM_ERROR, '邮箱不能为空');
  }
  const email = value.trim().toLowerCase();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) {
    throw new BusinessException(ErrorCode.PARAM_ERROR, '邮箱格式不正确');
  }
  return email;
}

/** 校验密码（至少 6 位） */
export function validatePassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 6) {
    throw new BusinessException(ErrorCode.PARAM_ERROR, '密码至少 6 位');
  }
  return value;
}
