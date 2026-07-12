/**
 * 底部固定 CTA 区域（带渐变遮罩 + 微交互）
 */

import { motion } from 'framer-motion';
import clsx from 'clsx';

interface BottomCTAProps {
  primaryText: string;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  secondaryText?: string;
  onSecondaryClick?: () => void;
  skipText?: string;
  onSkipClick?: () => void;
  hint?: string;
  gradient?: boolean;
}

export function BottomCTA({
  primaryText,
  onPrimaryClick,
  primaryDisabled = false,
  secondaryText,
  onSecondaryClick,
  skipText,
  onSkipClick,
  hint,
  gradient = false,
}: BottomCTAProps) {
  const hasSecondary = !!secondaryText;
  const hasSkip = !!skipText;

  return (
    <div
      className="px-5 pt-3 pb-5"
      style={{
        background: 'linear-gradient(180deg, transparent 0%, var(--color-bg) 30%)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
      }}
    >
      <div className="flex gap-3 items-center">
        {hasSecondary && (
          <motion.button
            onClick={onSecondaryClick}
            whileTap={{ scale: 0.97 }}
            className="h-12 min-w-[100px] px-4 text-text-2 text-sm font-medium border-[1.5px] border-border rounded-3xl bg-transparent active:opacity-60 whitespace-nowrap"
          >
            {secondaryText}
          </motion.button>
        )}
        {hasSkip && (
          <motion.button
            onClick={onSkipClick}
            whileTap={{ scale: 0.97 }}
            className="h-12 flex-1 text-text-2 text-sm font-medium border-[1.5px] border-border rounded-3xl bg-transparent active:opacity-60"
          >
            {skipText}
          </motion.button>
        )}
        <motion.button
          onClick={onPrimaryClick}
          disabled={primaryDisabled}
          whileTap={primaryDisabled ? undefined : { scale: 0.96 }}
          className={clsx(
            'relative h-[52px] text-white text-base font-semibold rounded-[26px] overflow-hidden',
            gradient ? 'flex-[1.5]' : 'flex-1',
            primaryDisabled && 'opacity-40',
          )}
          style={{
            background: gradient
              ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-gold) 100%)'
              : 'linear-gradient(135deg, var(--color-primary) 0%, #FF9C6E 100%)',
            boxShadow: primaryDisabled ? 'none' : '0 4px 16px rgba(255, 122, 69, 0.25)',
          }}
        >
          {/* 流光特效：开发模式 / 渐变按钮的微妙高光扫过 */}
          {!primaryDisabled && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['200%', '-100%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            />
          )}
          <span className="relative z-10">{primaryText}</span>
        </motion.button>
      </div>
      {hint && (
        <p className="text-xs text-primary text-center mt-3 font-medium">{hint}</p>
      )}
    </div>
  );
}
