/**
 * Step 4 确认生成 — 信息汇总 + 志愿数提示 + 生成推荐（含 Loading）
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomCTA } from '@/components/common/BottomCTA';
import { InfoTip } from '@/components/common/InfoTip';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useFormStore } from '@/store/formStore';
import { useRecommendationStore } from '@/store/recommendationStore';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/data/auth';
import { pickFormFields } from '@/utils/profile';
import {
  getProvinceName,
  getMaxVolunteers,
  getVolunteerUnitDesc,
} from '@/utils/provinceConfig';
import { formatSubjects, formatWeights } from '@/utils/format';
import { WEIGHT_TEMPLATES, COMMON_MAJORS } from '@/config/constants';
import type { StrategyMode, FillerRole } from '@/types/form';

/** 策略模式显示名称映射 */
const STRATEGY_LABELS: Record<StrategyMode, string> = {
  school_priority: '保院校',
  major_priority: '保专业',
};

/** 身份显示名称映射 */
const ROLE_LABELS: Record<FillerRole, string> = {
  student: '考生',
  parent: '家长',
};

export default function Step4Confirm() {
  const navigate = useNavigate();

  // —— 表单 Store ——
  const provinceCode = useFormStore((s) => s.provinceCode);
  const totalScore = useFormStore((s) => s.totalScore);
  const provinceRank = useFormStore((s) => s.provinceRank);
  const fillerRole = useFormStore((s) => s.fillerRole);
  const selectedSubjects = useFormStore((s) => s.selectedSubjects);
  const weightMode = useFormStore((s) => s.weightMode);
  const schoolWeight = useFormStore((s) => s.schoolWeight);
  const majorWeight = useFormStore((s) => s.majorWeight);
  const cityWeight = useFormStore((s) => s.cityWeight);
  const strategyMode = useFormStore((s) => s.strategyMode);
  const preferredMajors = useFormStore((s) => s.preferredMajors);
  const preferredCities = useFormStore((s) => s.preferredCities);
  const preferredLevels = useFormStore((s) => s.preferredLevels);

  // —— 推荐 Store ——
  const generating = useRecommendationStore((s) => s.generating);
  const setGenerating = useRecommendationStore((s) => s.setGenerating);
  const generateMock = useRecommendationStore((s) => s.generateMock);

  // —— 认证（登录态才落库档案）——
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // 生成状态提示（唤醒后端时展示）与错误提示
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGenerate = async () => {
    if (!provinceCode || provinceRank == null) return;
    setErrorMsg('');
    setStatusMsg('');
    setGenerating(true);
    try {
      // 登录态下，生成前显式保存一次志愿档案（与自动同步互补）
      if (isAuthenticated) {
        const form = useFormStore.getState();
        authApi
          .saveProfile({
            profileData: pickFormFields(form),
            currentStep: form.currentStep,
            hasDraft: form.hasDraft,
          })
          .catch(() => {});
      }
      // 将完整用户数据发送给后端；带自动唤醒+重试，处理 Railway 冷启动
      await generateMock(
        {
          provinceCode,
          userRank: provinceRank,
          totalScore,
          selectedSubjects,
          fillerRole,
          weightMode,
          schoolWeight,
          majorWeight,
          cityWeight,
          strategyMode,
          preferredMajors,
          preferredCities,
          preferredLevels,
        },
        setStatusMsg,
      );
      setStatusMsg('');
      navigate('/results', { replace: true });
    } catch (err) {
      setGenerating(false);
      setStatusMsg('');
      const msg = err instanceof Error ? err.message : '未知错误';
      setErrorMsg(`生成失败：${msg}。请检查网络后点击「重新生成」重试。`);
      console.error('生成推荐失败:', err);
    }
  };

  // 权重模式显示名
  const weightModeName =
    WEIGHT_TEMPLATES.find((t) => t.mode === weightMode)?.name ?? '自定义';

  // 志愿数提示
  const maxVolunteers = provinceCode ? getMaxVolunteers(provinceCode) : 0;
  const volunteerUnitDesc = provinceCode ? getVolunteerUnitDesc(provinceCode) : '';

  return (
    <AppLayout
      showProgressBar
      step={4}
      total={4}
      stepLabel="确认生成"
      bottomCTA={
        <BottomCTA
          secondaryText="上一步"
          onSecondaryClick={() => navigate('/wizard/step3')}
          primaryText="生成推荐方案"
          gradient
          onPrimaryClick={handleGenerate}
          primaryDisabled={!provinceCode || provinceRank == null}
        />
      }
    >
      <div className="px-4 py-4 space-y-3">
        {/* —— 基础信息汇总 —— */}
        <div className="bg-surface rounded-2xl border border-divider overflow-hidden">
          <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
            <span className="text-sm font-semibold text-text-1">基础信息</span>
            <button
              onClick={() => navigate('/wizard/step1')}
              className="text-xs text-blue active:opacity-60"
            >
              修改
            </button>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            <SummaryRow label="高考省份" value={provinceCode ? getProvinceName(provinceCode) : '未选择'} />
            <SummaryRow label="高考总分" value={totalScore != null ? `${totalScore}分` : '未输入'} />
            <SummaryRow label="省位次" value={provinceRank != null ? `约第${provinceRank.toLocaleString('zh-CN')}名` : '未查询'} />
            <SummaryRow label="填写身份" value={fillerRole ? ROLE_LABELS[fillerRole] : '未选择'} />
            <SummaryRow
              label="选科组合"
              value={selectedSubjects.length > 0 ? formatSubjects(selectedSubjects) : '未选择'}
            />
          </div>
        </div>

        {/* —— 偏好设置汇总 —— */}
        <div className="bg-surface rounded-2xl border border-divider overflow-hidden">
          <div className="px-4 py-3 border-b border-divider flex items-center justify-between">
            <span className="text-sm font-semibold text-text-1">偏好设置</span>
            <button
              onClick={() => navigate('/wizard/step3')}
              className="text-xs text-blue active:opacity-60"
            >
              修改
            </button>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            <SummaryRow
              label="权重模式"
              value={`${weightModeName}（${formatWeights({ school: schoolWeight, major: majorWeight, city: cityWeight })}）`}
            />
            <SummaryRow label="填报策略" value={STRATEGY_LABELS[strategyMode]} />
            <SummaryRow
              label="心仪专业"
              value={preferredMajors.length > 0 ? preferredMajors.join('、') : '未设置'}
            />
            <SummaryRow
              label="生成专业池"
              value={
                preferredMajors.length > 0
                  ? `仅 ${preferredMajors.length} 个偏好专业`
                  : `全部专业（${COMMON_MAJORS.length} 个）`
              }
            />
            <SummaryRow
              label="期望城市"
              value={preferredCities.length > 0 ? preferredCities.join('、') : '未设置'}
            />
            <SummaryRow
              label="院校层次"
              value={preferredLevels.length > 0 ? preferredLevels.join('、') : '未设置'}
            />
          </div>
        </div>

        {/* 志愿数提示 */}
        {provinceCode && maxVolunteers > 0 && (
          <InfoTip type="warning" title="志愿填报须知">
            您所在省份可填报 {maxVolunteers} 个志愿（{volunteerUnitDesc}），AI 将为您生成冲稳保垫四档方案
          </InfoTip>
        )}

        {/* 生成状态提示（唤醒后端时展示） */}
        {statusMsg && (
          <div
            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-blue"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <span className="animate-spin inline-block h-4 w-4 rounded-full border-2 border-blue border-t-transparent" />
            {statusMsg}
          </div>
        )}

        {/* 错误提示 + 重试 */}
        {errorMsg && (
          <div
            className="rounded-2xl px-4 py-3"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
          >
            <p className="mb-2 text-sm" style={{ color: '#dc2626' }}>
              {errorMsg}
            </p>
            <button
              onClick={handleGenerate}
              className="rounded-lg px-3 py-1.5 text-sm text-white"
              style={{ background: '#ef4444' }}
            >
              重新生成
            </button>
          </div>
        )}
      </div>

      {/* 生成中 Loading */}
      <LoadingOverlay visible={generating} />
    </AppLayout>
  );
}

/** 汇总行组件 */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-2">{label}</span>
      <span className="text-sm font-medium text-text-1 text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}
