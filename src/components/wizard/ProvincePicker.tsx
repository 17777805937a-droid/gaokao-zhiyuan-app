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

  // 省份拼音关键字（全称 + 首字母），用于模糊搜索。
  // 例如：山东 → "shandong sd"，用户搜「sd」「shandong」「山东」都能命中。
  const PINYIN: Record<string, string> = {
    '11': 'beijing bj',
    '12': 'tianjin tj',
    '13': 'hebei hb',
    '14': 'shanxi sx',
    '15': 'neimenggu nmg',
    '21': 'liaoning ln',
    '22': 'jilin jl',
    '23': 'heilongjiang hlj',
    '31': 'shanghai sh',
    '32': 'jiangsu js',
    '33': 'zhejiang zj',
    '34': 'anhui ah',
    '35': 'fujian fj',
    '36': 'jiangxi jx',
    '37': 'shandong sd',
    '41': 'henan hn',
    '42': 'hubei hb',
    '43': 'hunan hn',
    '44': 'guangdong gd',
    '45': 'guangxi gx',
    '46': 'hainan hn',
    '50': 'chongqing cq',
    '51': 'sichuan sc',
    '52': 'guizhou gz',
    '53': 'yunnan yn',
    '54': 'xizang xz',
    '61': 'shanxi sx',
    '62': 'gansu gs',
    '63': 'qinghai qh',
    '64': 'ningxia nx',
    '65': 'xinjiang xj',
  };

  const options: ActionSheetOption[] = PROVINCES.map((p) => ({
    label: p.name,
    value: p.code,
    badge: p.mode,
    keywords: PINYIN[p.code] ?? '',
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
        searchable
        searchPlaceholder="搜索省份（如 山东 / shandong / sd）"
      />
    </div>
  );
}
