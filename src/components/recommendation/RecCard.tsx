/**
 * 推荐卡片（院校+专业+标签+命中率+风险+AI建议）
 */



import { motion } from 'framer-motion';
import type { Tier, RiskSignal as RiskSignalType } from '@/types/recommendation';
import { RiskSignal } from './RiskSignal';

interface RecCardProps {
  school: string;
  major: string;
  tags: string[];
  tier: Tier;
  hitRate: string;
  risks: RiskSignalType[];
  aiAdvice: string;
  dataSource: string;
  dataYear: string;
  isNewMajor?: boolean;
  onClick: () => void;
}

const TIER_NAMES: Record<Tier, string> = {
  rush: '冲',
  stable: '稳',
  preserve: '保',
  cushion: '垫',
};

const TIER_COLORS: Record<Tier, { color: string; bgColor: string }> = {
  rush: { color: 'var(--color-rush)', bgColor: 'var(--color-rush-bg)' },
  stable: { color: 'var(--color-stable)', bgColor: 'var(--color-stable-bg)' },
  preserve: { color: 'var(--color-preserve)', bgColor: 'var(--color-preserve-bg)' },
  cushion: { color: 'var(--color-cushion)', bgColor: 'var(--color-cushion-bg)' },
};

export function RecCard({
  school,
  major,
  tags,
  tier,
  hitRate,
  risks,
  aiAdvice,
  dataSource,
  dataYear,
  isNewMajor = false,
  onClick,
}: RecCardProps) {
  const colors = TIER_COLORS[tier];

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 10px 26px rgba(255, 122, 69, 0.14)' }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="bg-surface rounded-2xl p-3.5 mb-2.5 border border-divider cursor-pointer"
    >
      {/* 院校 + 专业 */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-bold text-text-1 truncate">{school}</span>
            {isNewMajor && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-green-light text-green-dark font-medium shrink-0">
                新专业
              </span>
            )}
          </div>
          <div className="text-[13px] text-text-2 mt-0.5">{major}</div>
        </div>
        <span
          className="text-[10px] px-2 py-1 rounded font-semibold shrink-0 ml-2"
          style={{ background: colors.bgColor, color: colors.color }}
        >
          {TIER_NAMES[tier]}
        </span>
      </div>

      {/* 标签 */}
      <div className="flex gap-1 mt-2 flex-wrap">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-divider)] text-text-2"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 命中率 */}
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-divider">
        <span className="text-xs text-text-2">历史命中率</span>
        <span className="text-base font-bold" style={{ color: colors.color }}>
          {hitRate}
        </span>
        <span className="text-[11px] text-text-3 ml-auto">基于近3年数据</span>
      </div>

      {/* 风险信号 */}
      {risks.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {risks.map((risk, i) => (
            <RiskSignal key={i} risk={risk} compact />
          ))}
        </div>
      )}

      {/* AI 建议 */}
      <div
        className="mt-2 rounded-lg p-2.5"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #FFF8F0 100%)',
          border: '1px solid rgba(255, 122, 69, 0.08)',
        }}
      >
        <div className="flex gap-1 items-center mb-1">
          <span className="text-[11px]">🤖</span>
          <span className="text-[11px] font-semibold text-primary-dark">AI建议</span>
        </div>
        <div className="text-[11px] text-text-1 leading-relaxed">{aiAdvice}</div>
      </div>

      {/* 数据来源 */}
      <div className="mt-2 flex justify-between items-center">
        <span className="text-[10px] text-text-3">
          数据来源：{dataSource} · {dataYear}
        </span>
        <span className="text-[11px] text-blue">查看详情 ›</span>
      </div>
    </motion.div>
  );
}
