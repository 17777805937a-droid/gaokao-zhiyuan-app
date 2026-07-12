/**
 * 省份选择组件（ActionSheet + 模式标签联动）
 */

import { useState } from 'react';
import { ActionSheet, type ActionSheetOption } from '@/components/common/ActionSheet';
import { PROVINCES } from '@/config/constants';
import { getProvinceName, getExamMode, getProvinceTip } from '@/utils/provinceConfig';

interface ProvincePickerProps {
  value: string;
  onChange: (code: string) => void;
  onModeChange?: (mode: '3+3' | '3+1+2') => void;
}

export function ProvincePicker({ value, onChange, onModeChange }: ProvincePickerProps) {
  const [sheetVisible, setSheetVisible] = useState(false);

  const options: ActionSheetOption[] = PROVINCES.map((p) => ({
    label: p.name,
    value: p.code,
    badge: p.mode,
  }));

  const handleSelect = (code: string) => {
    onChange(code);
    const mode = getExamMode(code);
    if (mode && onModeChange) {
      onModeChange(mode);
    }
  };

  const selectedName = value ? getProvinceName(value) : '请选择省份';
  const selectedMode = value ? getExamMode(value) : null;
  const tip = value ? getProvinceTip(value) : '';

  return (
    <div>
      <div className="text-sm font-semibold text-text-1 mb-2">
        高考省份 <span className="text-red">*</span>
      </div>
      <button
        onClick={() => setSheetVisible(true)}
        className="w-full h-12 border-[1.5px] border-border rounded-lg flex items-center justify-between px-4 bg-surface active:border-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`text-base font-medium ${value ? 'text-text-1' : 'text-text-3'}`}>
            {selectedName}
          </span>
          {selectedMode && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-primary-light text-primary font-medium">
              {selectedMode}模式
            </span>
          )}
        </div>
        <span className="text-text-3 text-sm">▼</span>
      </button>

      {tip && (
        <p className="text-[11px] text-text-2 mt-2 leading-relaxed">{tip}</p>
      )}

      <ActionSheet
        visible={sheetVisible}
        title="选择高考省份"
        options={options}
        selectedValue={value}
        onSelect={handleSelect}
        onClose={() => setSheetVisible(false)}
      />
    </div>
  );
}
