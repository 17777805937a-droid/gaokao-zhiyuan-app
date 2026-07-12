/**
 * 底部弹出选择面板（省份选择器）
 */


import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export interface ActionSheetOption {
  label: string;
  value: string;
  badge?: string;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function ActionSheet({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: ActionSheetProps) {
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
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[393px] z-50 bg-surface rounded-t-2xl"
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

            {/* 选项列表 */}
            <div className="max-h-[400px] overflow-y-auto">
              {options.map((option) => {
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
              })}
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
