/**
 * 信息提示横幅（info / warning / success / danger）
 */

import React, { useState } from 'react';
import clsx from 'clsx';

interface InfoTipProps {
  type: 'info' | 'warning' | 'success' | 'danger';
  icon?: string;
  title?: string;
  children: React.ReactNode;
  closable?: boolean;
}

const TYPE_CONFIG = {
  info: {
    bg: 'bg-blue-light',
    borderColor: 'rgba(24, 144, 255, 0.2)',
    textColor: 'text-text-1',
    defaultIcon: '💡',
  },
  warning: {
    bg: 'bg-gold-light',
    borderColor: 'rgba(250, 173, 20, 0.2)',
    textColor: 'text-text-1',
    defaultIcon: '⚠️',
  },
  success: {
    bg: 'bg-green-light',
    borderColor: 'rgba(82, 196, 26, 0.2)',
    textColor: 'text-text-1',
    defaultIcon: '✅',
  },
  danger: {
    bg: 'bg-red-light',
    borderColor: 'rgba(255, 77, 79, 0.2)',
    textColor: 'text-text-1',
    defaultIcon: '🚫',
  },
};

export function InfoTip({ type, icon, title, children, closable = false }: InfoTipProps) {
  const [visible, setVisible] = useState(true);
  const config = TYPE_CONFIG[type];

  if (!visible) return null;

  return (
    <div
      className={clsx('rounded-lg px-3 py-2.5 flex gap-2 items-start', config.bg)}
      style={{ border: `1px solid ${config.borderColor}` }}
    >
      <span className="text-sm shrink-0">{icon ?? config.defaultIcon}</span>
      <div className="flex-1">
        {title && (
          <div className="text-xs font-semibold text-text-1 mb-1">{title}</div>
        )}
        <div className={clsx('text-[11px] text-text-2 leading-relaxed', config.textColor)}>
          {children}
        </div>
      </div>
      {closable && (
        <button
          onClick={() => setVisible(false)}
          className="text-text-3 text-sm shrink-0 active:opacity-60"
        >
          ✕
        </button>
      )}
    </div>
  );
}
