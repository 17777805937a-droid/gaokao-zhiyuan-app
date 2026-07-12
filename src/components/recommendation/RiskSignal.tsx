/**
 * 风险信号展示组件（5 种信号类型 + 等级样式）
 */


import clsx from 'clsx';
import type { RiskSignal as RiskSignalType } from '@/types/recommendation';

interface RiskSignalProps {
  risk: RiskSignalType;
  compact?: boolean;
}

const LEVEL_CONFIG = {
  low: {
    bgColor: 'bg-green-light',
    textColor: 'text-green-dark',
    icon: 'ℹ️',
    label: '低风险',
  },
  medium: {
    bgColor: 'bg-gold-light',
    textColor: 'text-text-1',
    icon: '⚠️',
    label: '中风险',
  },
  high: {
    bgColor: 'bg-red-light',
    textColor: 'text-red',
    icon: '🚨',
    label: '高风险',
  },
};

const TYPE_LABELS: Record<string, string> = {
  rank_rising: '位次上升',
  plan_reduced: '招生计划减少',
  new_major: '新增专业',
  score_volatility: '分数波动',
  policy_change: '政策变化',
};

export function RiskSignal({ risk, compact = false }: RiskSignalProps) {
  const config = LEVEL_CONFIG[risk.level];

  if (compact) {
    return (
      <div
        className={clsx('rounded-md px-2 py-1 flex gap-1 items-center', config.bgColor)}
      >
        <span className="text-[11px]">{config.icon}</span>
        <span className="text-[11px] text-text-1">{risk.message}</span>
      </div>
    );
  }

  return (
    <div className={clsx('rounded-lg p-2.5', config.bgColor)}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm">{config.icon}</span>
        <span className="text-xs font-semibold text-text-1">
          {TYPE_LABELS[risk.type] ?? '风险提示'}
        </span>
        <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', config.bgColor, config.textColor)}>
          {config.label}
        </span>
      </div>
      <div className="text-[11px] text-text-1 leading-relaxed">
        <div className="mb-1">· {risk.message}</div>
        <div className="text-[10px] text-text-2">建议：{risk.suggestion}</div>
      </div>
    </div>
  );
}
