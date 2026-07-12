/**
 * 选科规则引擎
 * 合法组合判定、非法组合拦截、覆盖率计算
 * 覆盖率素材已解耦至 src/data/static/subjectCoverage.json，
 * 本文件仅保留计算/取整算法，从 SUBJECT_COVERAGE 读取素材。
 */

import { SUBJECT_COVERAGE } from '@/data/static';

/** 选科校验结果 */
export interface SubjectValidationResult {
  valid: boolean;
  message: string;
  coverageRate: number;
}

/**
 * 校验选科组合是否合法
 * @param provinceCode 省份编码
 * @param selectedSubjects 已选科目列表
 * @returns 校验结果
 */
export function validateSubjects(
  provinceCode: string,
  selectedSubjects: string[],
): SubjectValidationResult {
  const isShandong = provinceCode === '37';

  if (isShandong) {
    // 3+3 模式：选 3 科
    if (selectedSubjects.length !== 3) {
      return {
        valid: false,
        message: `3+3模式需选择3门科目，当前已选${selectedSubjects.length}门`,
        coverageRate: 0,
      };
    }
    // 重复科目校验
    if (new Set(selectedSubjects).size !== selectedSubjects.length) {
      return {
        valid: false,
        message: '存在重复科目，请重新选择',
        coverageRate: 0,
      };
    }
    return {
      valid: true,
      message: '选科组合合法',
      coverageRate: calculateCoverage3_3(selectedSubjects),
    };
  }

  // 3+1+2 模式
  const firstSubjects = selectedSubjects.filter((s) => s === 'physics' || s === 'history');
  const secondSubjects = selectedSubjects.filter((s) => s !== 'physics' && s !== 'history');

  // 首选科目校验
  if (firstSubjects.length === 0) {
    return {
      valid: false,
      message: '请选择1门首选科目（物理或历史）',
      coverageRate: 0,
    };
  }
  if (firstSubjects.length > 1) {
    return {
      valid: false,
      message: '首选科目只能选择物理或历史中的1门，不能同时选择',
      coverageRate: 0,
    };
  }

  // 再选科目校验
  if (secondSubjects.length === 0) {
    return {
      valid: false,
      message: '请选择2门再选科目（化学/生物/地理/政治）',
      coverageRate: 0,
    };
  }
  if (secondSubjects.length === 1) {
    return {
      valid: false,
      message: '再选科目还需选择1门',
      coverageRate: 0,
    };
  }
  if (secondSubjects.length > 2) {
    return {
      valid: false,
      message: '再选科目只能选择2门',
      coverageRate: 0,
    };
  }

  // 物理历史不能出现在再选
  if (secondSubjects.includes('physics') || secondSubjects.includes('history')) {
    return {
      valid: false,
      message: '物理和历史为首选科目，不能再选为再选科目',
      coverageRate: 0,
    };
  }

  return {
    valid: true,
    message: '选科组合合法',
    coverageRate: calculateCoverage3_1_2(firstSubjects[0], secondSubjects),
  };
}

/**
 * 计算 3+3 模式覆盖率
 * 基于2024年教育部公布的选科要求统计（素材读取自 SUBJECT_COVERAGE.coverageMap3_3）
 */
function calculateCoverage3_3(subjects: string[]): number {
  const coverageMap = SUBJECT_COVERAGE.coverageMap3_3;

  const hasPhysics = subjects.includes('physics');
  const hasChemistry = subjects.includes('chemistry');

  let baseCoverage = subjects.reduce((sum, s) => sum + (coverageMap[s] ?? 0), 0) / 3;

  // 物化组合加成（算法常量保留在代码内）
  if (hasPhysics && hasChemistry) {
    baseCoverage = Math.max(baseCoverage, 95.2);
  }

  return Math.min(Math.round(baseCoverage * 10) / 10, 100);
}

/**
 * 计算 3+1+2 模式覆盖率
 * 首选系数读取自 SUBJECT_COVERAGE.firstSubjectCoeff3_1_2
 */
function calculateCoverage3_1_2(firstSubject: string, secondSubjects: string[]): number {
  const coeffMap = SUBJECT_COVERAGE.firstSubjectCoeff3_1_2;
  const coeff = coeffMap[firstSubject] ?? coeffMap.history;

  let baseCoverage: number;
  if (secondSubjects.includes('chemistry') && secondSubjects.includes('biology')) {
    baseCoverage = coeff.withChemistryBiology;
  } else if (secondSubjects.includes('chemistry')) {
    baseCoverage = coeff.withChemistry;
  } else {
    baseCoverage = coeff.base;
  }

  return Math.min(Math.round(baseCoverage * 10) / 10, 100);
}

/**
 * 获取首选科目（3+1+2 模式）
 */
export function getFirstSubject(subjects: string[]): string | null {
  const first = subjects.find((s) => s === 'physics' || s === 'history');
  return first ?? null;
}

/**
 * 获取再选科目（3+1+2 模式）
 */
export function getSecondSubjects(subjects: string[]): string[] {
  return subjects.filter((s) => s !== 'physics' && s !== 'history');
}

/**
 * 判断科目是否可选（选满后变灰）
 */
export function canSelectSubject(
  provinceCode: string,
  selectedSubjects: string[],
  subject: string,
): boolean {
  const isShandong = provinceCode === '37';

  if (selectedSubjects.includes(subject)) return true;

  if (isShandong) {
    // 3+3 模式：最多选 3 科
    return selectedSubjects.length < 3;
  }

  // 3+1+2 模式
  const isFirstChild = subject === 'physics' || subject === 'history';
  const firstSubjects = selectedSubjects.filter((s) => s === 'physics' || s === 'history');
  const secondSubjects = selectedSubjects.filter((s) => s !== 'physics' && s !== 'history');

  if (isFirstChild) {
    // 首选科目：已选1门则不能选
    return firstSubjects.length === 0;
  } else {
    // 再选科目：已选2门则不能选
    return secondSubjects.length < 2;
  }
}
