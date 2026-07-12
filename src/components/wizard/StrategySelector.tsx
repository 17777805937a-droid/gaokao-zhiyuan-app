/**
 * 填报策略选择器（保院校 / 保专业 + 联动权重模板）
 */



import { CardSelector, type CardSelectorOption } from '@/components/common/CardSelector';

interface StrategySelectorProps {
  value: 'school_priority' | 'major_priority';
  onChange: (strategy: string) => void;
  hasMajorPreference: boolean;
}

export function StrategySelector({ value, onChange, hasMajorPreference }: StrategySelectorProps) {
  const options: CardSelectorOption<string>[] = [
    {
      value: 'school_priority',
      label: '保院校',
      desc: '优先更高层次学校',
      icon: '🏫',
    },
    {
      value: 'major_priority',
      label: '保专业',
      desc: '优先目标专业',
      icon: '📚',
    },
  ];

  return (
    <div>
      <div className="text-sm font-semibold text-text-1 mb-2">🎯 填报策略</div>
      <CardSelector
        options={options}
        value={value}
        onChange={(val) => onChange(val as string)}
        columns={2}
      />
      {value === 'major_priority' && !hasMajorPreference && (
        <p className="text-[11px] text-gold mt-2 flex items-center gap-1">
          <span>⚠️</span>
          <span>选择"保专业"策略建议先填写专业偏好，否则效果不佳</span>
        </p>
      )}
    </div>
  );
}
