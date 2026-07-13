/**
 * 权重选择器（3 预设模板 + 折叠高级滑块）
 */

import { useState } from 'react';
import clsx from 'clsx';
import { WEIGHT_TEMPLATES } from '@/config/constants';
import { formatWeights } from '@/utils/format';
import { rebalanceWeights, weightSum } from '@/utils/weight';

interface WeightSelectorProps {
  mode: 'school_first' | 'major_first' | 'balanced' | 'custom';
  weights: { school: number; major: number; city: number };
  onModeChange: (mode: string) => void;
  onWeightsChange: (weights: { school: number; major: number; city: number }) => void;
}

const WEIGHT_COLORS = ['var(--color-rush)', 'var(--color-stable)', 'var(--color-blue)'];

export function WeightSelector({
  mode,
  weights,
  onModeChange,
  onWeightsChange,
}: WeightSelectorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTemplateSelect = (templateMode: string) => {
    onModeChange(templateMode);
    const template = WEIGHT_TEMPLATES.find((t) => t.mode === templateMode);
    if (template) {
      onWeightsChange(template.weights);
    }
  };

  const handleSliderChange = (key: 'school' | 'major' | 'city', value: number) => {
    // 自动平衡：拖动一条，其余两条按当前比例补到总和 100%
    const newWeights = rebalanceWeights(weights, key, value);
    onWeightsChange(newWeights);
    onModeChange('custom');
  };

  return (
    <div>
      <div className="text-sm font-semibold text-text-1 mb-2">⚖️ 核心诉求（权重）</div>

      {/* 预设模板 */}
      <div className="flex gap-2">
        {WEIGHT_TEMPLATES.map((template) => {
          const selected = mode === template.mode;
          const w = template.weights;
          return (
            <button
              key={template.mode}
              onClick={() => handleTemplateSelect(template.mode)}
              className={clsx(
                'flex-1 rounded-xl p-2.5 text-center transition-all active:scale-[0.98]',
                selected
                  ? 'border-2 border-primary bg-primary-light'
                  : 'border-[1.5px] border-border bg-surface',
              )}
            >
              <div
                className={clsx(
                  'text-xs font-semibold',
                  selected ? 'text-primary-dark' : 'text-text-1',
                )}
              >
                {template.name}
              </div>
              <div className="text-[10px] text-text-2 mt-0.5">
                {formatWeights(w)}
              </div>
              {/* 迷你比例条 */}
              <div className="flex gap-0.5 mt-1.5 h-1">
                {[w.school, w.major, w.city].map((val, j) => (
                  <div
                    key={j}
                    className="rounded-sm"
                    style={{
                      flex: val,
                      background: WEIGHT_COLORS[j],
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* 高级设置 */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-[11px] text-blue mt-2"
      >
        高级设置：自定义权重 {showAdvanced ? '▲' : '▼'}
      </button>

      {showAdvanced && (
        <div className="mt-3 bg-surface rounded-xl p-4 border border-divider">
          {(['school', 'major', 'city'] as const).map((key, i) => {
            const labels = ['院校权重', '专业权重', '城市权重'];
            return (
              <div key={key} className={i > 0 ? 'mt-3' : ''}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-text-2">{labels[i]}</span>
                  <span className="text-sm font-semibold text-primary">{weights[key]}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weights[key]}
                  onChange={(e) => handleSliderChange(key, parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${WEIGHT_COLORS[i]} ${weights[key]}%, var(--color-border) ${weights[key]}%)`,
                  }}
                />
              </div>
            );
          })}
          <p className="text-[11px] text-text-3 mt-2 text-center">
            权重之和：{weightSum(weights)}%（自动平衡，拖动任一滑块其余自动按比例调整）
          </p>
        </div>
      )}
    </div>
  );
}
