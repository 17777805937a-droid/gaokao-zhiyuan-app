/**
 * 分数输入组件（数字键盘 + 满分提示 + blur 触发反查）
 */

import React from 'react';
import clsx from 'clsx';
import { MAX_SCORE } from '@/config/constants';
import { validateScore } from '@/utils/validation';

interface ScoreInputProps {
  value: number | null;
  onChange: (score: number | null) => void;
  onBlur: () => void;
  provinceCode: string;
  subjectCategory: string;
}

export function ScoreInput({ value, onChange, onBlur }: ScoreInputProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(null);
      setError(null);
      return;
    }
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    onChange(num);
  };

  const handleBlur = () => {
    setFocused(false);
    if (value !== null) {
      const result = validateScore(value);
      if (!result.valid) {
        setError(result.message ?? '分数无效');
      } else {
        setError(null);
      }
    }
    onBlur();
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-sm font-semibold text-text-1">
          高考总分 <span className="text-red">*</span>
        </div>
        <span className="text-xs text-text-3">满分{MAX_SCORE}</span>
      </div>
      <div
        className={clsx(
          'h-14 border-[1.5px] rounded-lg flex items-center px-4 bg-surface transition-colors',
          error
            ? 'border-red'
            : focused || value !== null
              ? 'border-primary'
              : 'border-border',
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          value={value ?? ''}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          placeholder="请输入分数"
          className="flex-1 text-2xl font-bold bg-transparent outline-none"
          style={{ color: value !== null ? 'var(--color-primary)' : 'var(--color-text-3)' }}
        />
        {value !== null && <span className="text-base text-text-2 ml-1">分</span>}
      </div>
      {error && <p className="text-xs text-red mt-1.5">{error}</p>}
    </div>
  );
}
