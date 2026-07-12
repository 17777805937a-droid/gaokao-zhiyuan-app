/**
 * 选科组合实时校验 Hook
 * 非法组合拦截 + 覆盖率计算
 */

import { useMemo, useCallback } from 'react';
import { useFormStore } from '@/store/formStore';
import { validateSubjects, canSelectSubject } from '@/utils/subjectRules';
import type { SubjectValidationResult } from '@/utils/subjectRules';

/**
 * 选科校验 Hook
 */
export function useSubjectValidation() {
  const provinceCode = useFormStore((s) => s.provinceCode);
  const selectedSubjects = useFormStore((s) => s.selectedSubjects);

  /** 校验结果 */
  const validation: SubjectValidationResult = useMemo(() => {
    if (!provinceCode || selectedSubjects.length === 0) {
      return { valid: false, message: '请选择科目', coverageRate: 0 };
    }
    return validateSubjects(provinceCode, selectedSubjects);
  }, [provinceCode, selectedSubjects]);

  /** 判断科目是否可选 */
  const canSelect = useCallback(
    (subject: string): boolean => {
      if (!provinceCode) return false;
      return canSelectSubject(provinceCode, selectedSubjects, subject);
    },
    [provinceCode, selectedSubjects],
  );

  /** 覆盖率 */
  const coverageRate = validation.coverageRate;

  /** 是否已完成选科 */
  const isComplete = useMemo(() => {
    if (!provinceCode) return false;
    const isShandong = provinceCode === '37';
    const requiredCount = isShandong ? 3 : 3; // 3+3选3科, 3+1+2选1+2=3科
    return selectedSubjects.length === requiredCount && validation.valid;
  }, [provinceCode, selectedSubjects, validation.valid]);

  return {
    validation,
    canSelect,
    coverageRate,
    isComplete,
  };
}
