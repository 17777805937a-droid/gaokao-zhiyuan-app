/**
 * 表单自动保存 Hook
 * blur 触发保存 + 防抖写入
 */

import { useCallback, useRef } from 'react';
import { useFormStore } from '@/store/formStore';
import type { FormData } from '@/types/form';

/**
 * 表单自动保存 Hook
 * 提供字段级别的 blur 自动保存
 */
export function useFormAutoSave() {
  const setField = useFormStore((s) => s.setField);
  const setHasDraft = useFormStore((s) => s.setHasDraft);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 保存单个字段（带防抖） */
  const saveField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        setField(key, value);
        setHasDraft(true);
      }, 300);
    },
    [setField, setHasDraft],
  );

  /** 立即保存（无防抖） */
  const saveImmediately = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      setField(key, value);
      setHasDraft(true);
    },
    [setField, setHasDraft],
  );

  return { saveField, saveImmediately };
}
