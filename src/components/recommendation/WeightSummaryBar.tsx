/**
 * 权重摘要条（固定顶部 + 跳转调整）
 */


import { WEIGHT_TEMPLATES } from '@/config/constants';

interface WeightSummaryBarProps {
  mode: string;
  weights: { school: number; major: number; city: number };
  onAdjust: () => void;
}

export function WeightSummaryBar({ mode, weights, onAdjust }: WeightSummaryBarProps) {
  const template = WEIGHT_TEMPLATES.find((t) => t.mode === mode);
  const modeName = template?.name ?? '自定义';

  return (
    <div
      className="mt-2 bg-primary-light rounded-lg px-3 py-1.5 flex items-center gap-2"
    >
      <span className="text-xs text-primary-dark font-medium">
        ⚖️ {modeName} · 院校{weights.school}% · 专业{weights.major}% · 城市{weights.city}%
      </span>
      <button
        onClick={onAdjust}
        className="text-[11px] text-blue ml-auto active:opacity-60"
      >
        调整
      </button>
    </div>
  );
}
