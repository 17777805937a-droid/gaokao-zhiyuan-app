/**
 * Wizard 顶部进度条（渐变填充）
 */

import { motion } from 'framer-motion';

interface ProgressBarProps {
  step: number;
  total: number;
  label?: string;
}

export function ProgressBar({ step, total, label }: ProgressBarProps) {
  const pct = (step / total) * 100;

  return (
    <div className="px-5 pt-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-text-2 font-medium">
          第{step}步/共{total}步{label ? ` · ${label}` : ''}
        </span>
        <span className="text-xs text-primary font-semibold">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-gold) 100%)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
