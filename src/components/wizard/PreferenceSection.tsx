/**
 * 偏好区域容器（可折叠面板 + 跳过提示）
 */

import React, { useState } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreferenceSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  optional?: boolean;
}

export function PreferenceSection({
  title,
  icon,
  children,
  defaultOpen = false,
  optional = true,
}: PreferenceSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-surface rounded-2xl border border-divider overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-3 flex items-center justify-between active:bg-[var(--color-divider)] transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          <span className="text-sm font-semibold text-text-1">{title}</span>
          {optional && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-divider)] text-text-2 font-medium">
              选填
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            'text-text-3 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
