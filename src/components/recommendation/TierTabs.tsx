/**
 * 冲稳保垫四档 Tab 切换器（暖→冷色阶）
 */


import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { Tier } from '@/types/recommendation';

interface TierTabsProps {
  tiers: Array<{
    key: Tier;
    name: string;
    count: number;
    hitRate: string;
  }>;
  activeTier: string;
  onChange: (tier: string) => void;
}

const TIER_COLORS: Record<Tier, { color: string; bgColor: string }> = {
  rush: { color: 'var(--color-rush)', bgColor: 'var(--color-rush-bg)' },
  stable: { color: 'var(--color-stable)', bgColor: 'var(--color-stable-bg)' },
  preserve: { color: 'var(--color-preserve)', bgColor: 'var(--color-preserve-bg)' },
  cushion: { color: 'var(--color-cushion)', bgColor: 'var(--color-cushion-bg)' },
};

export function TierTabs({ tiers, activeTier, onChange }: TierTabsProps) {
  return (
    <div className="flex px-5 pt-3 pb-2 gap-1.5">
      {tiers.map((tier) => {
        const isActive = activeTier === tier.key;
        const colors = TIER_COLORS[tier.key];

        return (
          <motion.button
            key={tier.key}
            onClick={() => onChange(tier.key)}
            className={clsx(
              'relative flex-1 rounded-xl py-2 px-1 text-center transition-all overflow-hidden',
              isActive ? 'text-white' : '',
            )}
            style={{
              background: isActive ? colors.color : colors.bgColor,
              border: `1.5px solid ${isActive ? colors.color : colors.color + '30'}`,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <div
              className="text-[15px] font-bold"
              style={{ color: isActive ? '#fff' : colors.color }}
            >
              {tier.name}
            </div>
            <div
              className="text-[11px] mt-0.5"
              style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--color-text-2)' }}
            >
              {tier.count}个
            </div>
            <div
              className="text-[9px] mt-0.5"
              style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--color-text-3)' }}
            >
              {tier.hitRate}
            </div>
            {/* 滑动指示条：随选中档位在两个 tab 间平滑移动 */}
            {isActive && (
              <motion.span
                layoutId="tierUnderline"
                className="absolute left-1/2 bottom-1 h-1 w-7 -translate-x-1/2 rounded-full"
                style={{ background: '#fff' }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
