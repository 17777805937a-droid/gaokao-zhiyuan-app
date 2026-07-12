/**
 * 命中率圆环图（SVG 描边动画绘制 + 档位标识）
 */

import { motion } from 'framer-motion';
import type { Tier } from '@/types/recommendation';
import { useCountUp } from '@/hooks/useCountUp';

interface HitRateRingProps {
  hitRate: string;
  tier: Tier;
  size?: number;
}

const TIER_NAMES: Record<Tier, string> = {
  rush: '冲',
  stable: '稳',
  preserve: '保',
  cushion: '垫',
};

const TIER_COLORS: Record<Tier, string> = {
  rush: 'var(--color-rush)',
  stable: 'var(--color-stable)',
  preserve: 'var(--color-preserve)',
  cushion: 'var(--color-cushion)',
};

export function HitRateRing({ hitRate, tier, size = 56 }: HitRateRingProps) {
  // 解析命中率，取中间值用于圆环展示
  const match = hitRate.match(/(\d+)-(\d+)/);
  let percentage = 60;
  if (match) {
    percentage = Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
  } else if (hitRate.includes('90')) {
    percentage = 95;
  }

  const color = TIER_COLORS[tier];
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percentage / 100);
  const shown = useCountUp(percentage, 0.9, 0);

  return (
    <div
      className="relative rounded-full flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-divider)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center font-bold leading-none"
        style={{ color, fontSize: size * 0.24 }}
      >
        <span>{shown}%</span>
        <span className="text-[9px] font-semibold opacity-80 mt-0.5" style={{ color }}>
          {TIER_NAMES[tier]}档
        </span>
      </div>
    </div>
  );
}
