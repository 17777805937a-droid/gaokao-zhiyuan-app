/**
 * 底部弹出选择面板（省份选择器）
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface ActionSheetOption {
  label: string;
  value: string;
  badge?: string;
  /** 模糊搜索关键字（如拼音全称 / 拼音首字母），不参与展示，仅用于搜索匹配 */
  keywords?: string;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  /** 是否显示顶部搜索框（模糊查询） */
  searchable?: boolean;
  /** 搜索框占位文案 */
  searchPlaceholder?: string;
}

export function ActionSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
  searchable = false,
  searchPlaceholder = '搜索',
}: ActionSheetProps) {
  const [query, setQuery] = useState('');

  // 关闭面板时清空搜索词，避免下次打开残留
  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.keywords ? o.keywords.toLowerCase().includes(q) : false),
    );
  }, [options, query, searchable]);

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* 遮罩 */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* 面板 */}
          <motion.div
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] z-50 bg-surface rounded-t-2xl flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* 拖拽指示器 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {title && (
              <div className="px-5 py-3 text-center text-base font-semibold text-text-1">
                {title}
              </div>
            )}

            {/* 模糊搜索框 */}
            {searchable && (
              <div className="px-5 pb-2">
                <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-fill border border-border">
                  <span className="text-text-3 text-sm">🔍</span>
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="flex-1 bg-transparent outline-none text-sm text-text-1 placeholder:text-text-3"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="text-text-3 text-sm px-1"
                      aria-label="清空"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 选项列表 */}
            <div className="max-h-[400px] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-5 py-10 text-center text-text-3 text-sm">
                  未找到匹配的省份
                </div>
              ) : (
                filtered.map((option) => {
                  const selected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSelect(option.value);
                        onClose();
                      }}
                      className={clsx(
                        'w-full px-5 py-4 flex items-center justify-between',
                        'border-b border-divider active:bg-primary-light transition-colors',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            'text-base font-medium',
                            selected ? 'text-primary' : 'text-text-1',
                          )}
                        >
                          {option.label}
                        </span>
                        {option.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-light text-primary font-medium">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      {selected && (
                        <span className="text-primary text-lg">✓</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* 取消按钮 */}
            <button
              onClick={onClose}
              className="w-full py-4 text-text-2 text-sm font-medium border-t border-divider active:bg-[var(--color-divider)]"
            >
              取消
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
