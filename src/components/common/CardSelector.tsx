/**
 * 卡片式选择器（支持单选/多选/列数配置/最大选择数）
 */


import clsx from 'clsx';

export interface CardSelectorOption<T> {
  value: T;
  label: string;
  icon?: string;
  desc?: string;
  badge?: string;
}

interface CardSelectorProps<T> {
  options: CardSelectorOption<T>[];
  value?: T;
  values?: T[];
  multiple?: boolean;
  onChange: (value: T | T[]) => void;
  columns?: 1 | 2 | 3;
  maxSelect?: number;
}

export function CardSelector<T extends string>({
  options,
  value,
  values = [],
  multiple = false,
  onChange,
  columns = 2,
  maxSelect,
}: CardSelectorProps<T>) {
  const isSelected = (optionValue: T): boolean => {
    if (multiple) {
      return values.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleClick = (optionValue: T) => {
    if (multiple) {
      const currentValues = values;
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter((v) => v !== optionValue));
      } else {
        if (maxSelect && currentValues.length >= maxSelect) return;
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
    }
  };

  const gridClass = clsx(
    'grid gap-2.5',
    columns === 1 && 'grid-cols-1',
    columns === 2 && 'grid-cols-2',
    columns === 3 && 'grid-cols-3',
  );

  return (
    <div className={gridClass}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        return (
          <button
            key={String(option.value)}
            onClick={() => handleClick(option.value)}
            className={clsx(
              'rounded-xl p-3 text-left transition-all active:scale-[0.98]',
              'min-h-[56px] flex flex-col justify-center',
              selected
                ? 'border-2 border-primary bg-primary-light'
                : 'border-[1.5px] border-border bg-surface',
            )}
          >
            <div className="flex items-center gap-2">
              {option.icon && <span className="text-xl">{option.icon}</span>}
              <span
                className={clsx(
                  'text-sm font-semibold',
                  selected ? 'text-primary-dark' : 'text-text-1',
                )}
              >
                {option.label}
              </span>
            </div>
            {option.desc && (
              <span className="text-[10px] text-text-2 mt-1">{option.desc}</span>
            )}
            {option.badge && (
              <span
                className={clsx(
                  'inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 font-medium w-fit',
                  selected ? 'bg-primary text-white' : 'bg-[var(--color-divider)] text-text-2',
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
