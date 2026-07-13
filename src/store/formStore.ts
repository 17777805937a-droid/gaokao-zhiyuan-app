/**
 * 表单状态管理 — Zustand + persist 中间件
 * 实现 localStorage 自动持久化 + 断点续填
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FormData, WeightMode, StrategyMode, RankLookupStatus } from '@/types/form';
import { PROVINCES } from '@/data/static';

interface FormState extends FormData {
  // —— Wizard 步骤管理 ——
  currentStep: number;
  maxCompletedStep: number;
  hasDraft: boolean;

  // —— Actions ——
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  setStep: (step: number) => void;
  setMaxCompletedStep: (step: number) => void;
  setHasDraft: (hasDraft: boolean) => void;
  resetForm: () => void;
  loadDraft: () => void;
}

const initialState: FormData = {
  // Step 1
  provinceCode: null,
  subjectCategory: null,
  totalScore: null,
  provinceRank: null,
  autoRank: null,
  rankRange: null,
  sameScoreCount: null,
  rankLookupStatus: 'idle' as RankLookupStatus,
  rankSource: null,
  fillerRole: null,

  // Step 2
  selectedSubjects: [],

  // Step 3
  preferredCategories: [],
  preferredMajors: [],
  excludedMajors: [],
  preferredCities: [],
  excludedCities: [],
  preferredEconomicZones: [],
  preferredLevels: [],
  schoolNature: [],
  minSchoolLevel: '',
  weightMode: 'balanced' as WeightMode,
  schoolWeight: 33,
  majorWeight: 34,
  cityWeight: 33,
  strategyMode: 'school_priority' as StrategyMode,
  specialIdentity: [],
  nationalityBonusPoints: null,
  subjectScores: {},
};

const initialWizardState = {
  currentStep: 1,
  maxCompletedStep: 0,
  hasDraft: false,
};

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...initialState,
      ...initialWizardState,

      setField: (key, value) =>
        set((state) => {
          // 当省份变更时，清空选科和位次相关数据
          if (key === 'provinceCode' && value !== state.provinceCode) {
            const newCode = value as string | null;
            // 根据高考模式自动设置默认选科类别：
            // 3+3 模式（浙江/上海/北京等）→ comprehensive；
            // 3+1+2 模式 → 默认 physics（Step2 可改）；
            // 确保 subjectCategory 不为 null，否则位次反查 hook 的守卫条件会跳过查询
            const p = newCode ? PROVINCES.find((x) => x.code === newCode) : null;
            const mode = p?.mode ?? '3+1+2';
            const defaultCategory = mode === '3+3'
              ? ('comprehensive' as const)
              : ('physics' as const);
            return {
              [key]: value,
              selectedSubjects: [],
              subjectCategory: defaultCategory,
              provinceRank: null,
              autoRank: null,
              rankRange: null,
              sameScoreCount: null,
              rankLookupStatus: 'idle' as RankLookupStatus,
              hasDraft: true,
            } as Partial<FormState>;
          }
          // 任何字段变更都标记为有草稿
          return { [key]: value, hasDraft: true } as Partial<FormState>;
        }),

      setStep: (step) =>
        set((state) => ({
          currentStep: step,
          maxCompletedStep: Math.max(state.maxCompletedStep, step),
          hasDraft: true,
        })),

      setMaxCompletedStep: (step) => set({ maxCompletedStep: step }),

      setHasDraft: (hasDraft) => set({ hasDraft }),

      resetForm: () =>
        set({
          ...initialState,
          ...initialWizardState,
        }),

      loadDraft: () =>
        set((state) => ({
          currentStep: state.maxCompletedStep > 0 ? Math.min(state.maxCompletedStep + 1, 4) : 1,
        })),
    }),
    {
      name: 'gaokao-form-draft',
      partialize: (state) => ({
        // 仅持久化表单数据 + 步骤状态，不持久化临时态
        currentStep: state.currentStep,
        maxCompletedStep: state.maxCompletedStep,
        hasDraft: state.hasDraft,
        provinceCode: state.provinceCode,
        subjectCategory: state.subjectCategory,
        totalScore: state.totalScore,
        provinceRank: state.provinceRank,
        autoRank: state.autoRank,
        rankRange: state.rankRange,
        sameScoreCount: state.sameScoreCount,
        fillerRole: state.fillerRole,
        selectedSubjects: state.selectedSubjects,
        preferredCategories: state.preferredCategories,
        preferredMajors: state.preferredMajors,
        excludedMajors: state.excludedMajors,
        preferredCities: state.preferredCities,
        excludedCities: state.excludedCities,
        preferredEconomicZones: state.preferredEconomicZones,
        preferredLevels: state.preferredLevels,
        schoolNature: state.schoolNature,
        minSchoolLevel: state.minSchoolLevel,
        weightMode: state.weightMode,
        schoolWeight: state.schoolWeight,
        majorWeight: state.majorWeight,
        cityWeight: state.cityWeight,
        strategyMode: state.strategyMode,
        specialIdentity: state.specialIdentity,
        nationalityBonusPoints: state.nationalityBonusPoints,
        subjectScores: state.subjectScores,
      }),
    },
  ),
);
