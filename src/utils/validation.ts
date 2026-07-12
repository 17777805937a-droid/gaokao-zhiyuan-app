/**
 * Zod Schema 定义 + 校验工具函数
 */

import { z } from 'zod';
import { MAX_SCORE, RANK_DEVIATION_THRESHOLD } from '@/config/constants';

/** 省份校验 */
export const provinceSchema = z
  .enum(['37', '13', '43'])
  .refine((val) => val !== undefined, { message: '请选择高考省份' });

/** 分数校验 */
export const scoreSchema = z
  .number({ invalid_type_error: '请输入数字分数' })
  .int('请输入整数分数')
  .min(0, '分数应在0-750之间')
  .max(MAX_SCORE, `分数应在0-${MAX_SCORE}之间`);

/** 位次校验 */
export const rankSchema = z
  .number({ invalid_type_error: '请输入数字位次' })
  .int('位次应为整数')
  .min(1, '位次应大于0')
  .max(999999, '位次值过大，请检查');

/** 选科组合校验（3+1+2 模式） */
export const subjectSchema3_1_2 = z
  .object({
    provinceCode: z.string(),
    selectedSubjects: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const { selectedSubjects } = data;
    const firstSubjects = selectedSubjects.filter((s) => s === 'physics' || s === 'history');
    const secondSubjects = selectedSubjects.filter((s) => s !== 'physics' && s !== 'history');

    if (firstSubjects.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '请选择1门首选科目（物理或历史）',
        path: ['selectedSubjects'],
      });
    } else if (firstSubjects.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '首选科目只能选择物理或历史中的1门',
        path: ['selectedSubjects'],
      });
    }

    if (secondSubjects.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `再选科目需选择2门，当前已选${secondSubjects.length}门`,
        path: ['selectedSubjects'],
      });
    } else if (secondSubjects.length > 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '再选科目只能选择2门',
        path: ['selectedSubjects'],
      });
    }

    if (secondSubjects.includes('physics') || secondSubjects.includes('history')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '物理和历史为首选科目，不能再选为再选科目',
        path: ['selectedSubjects'],
      });
    }
  });

/** 选科组合校验（3+3 模式） */
export const subjectSchema3_3 = z
  .object({
    provinceCode: z.string(),
    selectedSubjects: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    const { selectedSubjects } = data;
    if (selectedSubjects.length !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `3+3模式需选择3门科目，当前已选${selectedSubjects.length}门`,
        path: ['selectedSubjects'],
      });
    }
    if (new Set(selectedSubjects).size !== selectedSubjects.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '存在重复科目，请重新选择',
        path: ['selectedSubjects'],
      });
    }
  });

/** 权重校验 */
export const weightSchema = z
  .object({
    mode: z.enum(['school_first', 'major_first', 'balanced', 'custom']),
    schoolWeight: z.number().min(0).max(100),
    majorWeight: z.number().min(0).max(100),
    cityWeight: z.number().min(0).max(100),
  })
  .refine(
    (data) => data.mode !== 'custom' || data.schoolWeight + data.majorWeight + data.cityWeight === 100,
    { message: '权重之和需为100', path: ['schoolWeight'] },
  )
  .refine(
    (data) =>
      data.mode !== 'custom' || data.schoolWeight > 0 || data.majorWeight > 0 || data.cityWeight > 0,
    { message: '至少有一个权重需大于0', path: ['schoolWeight'] },
  );

/** Step 1 校验 Schema */
export const step1Schema = z.object({
  provinceCode: provinceSchema,
  totalScore: scoreSchema,
  provinceRank: rankSchema.optional(),
  fillerRole: z.enum(['student', 'parent'], { required_error: '请选择填写者身份' }),
});

/** 完整表单 Schema */
export const formSchema = z.object({
  provinceCode: provinceSchema,
  subjectCategory: z.enum(['physics', 'history', 'comprehensive']),
  selectedSubjects: z.array(z.string()).min(1, '请选择科目'),
  totalScore: scoreSchema,
  provinceRank: rankSchema.optional(),
  fillerRole: z.enum(['student', 'parent']),
});

/** 校验分数范围 */
export function validateScore(score: number): { valid: boolean; message?: string } {
  const result = scoreSchema.safeParse(score);
  if (result.success) return { valid: true };
  return { valid: false, message: result.error.issues[0]?.message ?? '分数无效' };
}

/** 校验位次 */
export function validateRank(rank: number): { valid: boolean; message?: string } {
  const result = rankSchema.safeParse(rank);
  if (result.success) return { valid: true };
  return { valid: false, message: result.error.issues[0]?.message ?? '位次无效' };
}

/** 计算位次偏差 */
export function calculateRankDeviation(autoRank: number | null, userRank: number | null): number {
  if (!autoRank || !userRank || autoRank === 0) return 0;
  return Math.abs(userRank - autoRank) / autoRank;
}

/** 判断是否需要位次偏差警告 */
export function shouldShowDeviationWarning(autoRank: number | null, userRank: number | null): boolean {
  return calculateRankDeviation(autoRank, userRank) > RANK_DEVIATION_THRESHOLD;
}

/** 校验权重和是否为100 */
export function validateWeightSum(
  school: number,
  major: number,
  city: number,
): { valid: boolean; message?: string } {
  const sum = school + major + city;
  if (sum !== 100) {
    return { valid: false, message: `权重之和应为100，当前为${sum}` };
  }
  if (school === 0 && major === 0 && city === 0) {
    return { valid: false, message: '至少有一个权重需大于0' };
  }
  return { valid: true };
}
