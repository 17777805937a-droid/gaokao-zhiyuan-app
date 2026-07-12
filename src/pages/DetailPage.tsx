/**
 * 推荐详情页 — 院校专业信息 + 命中率 + 计算依据 + 风险信号 + AI建议
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavBar } from '@/components/common/NavBar';
import { BottomCTA } from '@/components/common/BottomCTA';
import { HitRateRing } from '@/components/recommendation/HitRateRing';
import { RiskSignal } from '@/components/recommendation/RiskSignal';
import { useRecommendationStore } from '@/store/recommendationStore';
import { formatNumber } from '@/utils/format';
import type { Tier } from '@/types/recommendation';

/** 档位显示名 */
const TIER_NAMES: Record<Tier, string> = {
  rush: '冲',
  stable: '稳',
  preserve: '保',
  cushion: '垫',
};

/** 档位颜色 */
const TIER_COLORS: Record<Tier, string> = {
  rush: 'var(--color-rush)',
  stable: 'var(--color-stable)',
  preserve: 'var(--color-preserve)',
  cushion: 'var(--color-cushion)',
};

export default function DetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const recommendations = useRecommendationStore((s) => s.recommendations);

  // 从四档中查找匹配的推荐
  const allRecs = [
    ...recommendations.rush,
    ...recommendations.stable,
    ...recommendations.preserve,
    ...recommendations.cushion,
  ];
  const rec = allRecs.find((r) => r.id === id);

  const [showCalcBasis, setShowCalcBasis] = useState(false);

  // 未找到推荐
  if (!rec) {
    return (
      <AppLayout
        bottomCTA={
          <BottomCTA
            secondaryText="返回列表"
            onSecondaryClick={() => navigate('/results')}
            primaryText="重新生成"
            onPrimaryClick={() => navigate('/wizard/step4')}
          />
        }
      >
        <div className="sticky top-0 z-10 bg-[var(--color-bg)]">
          <NavBar title="院校详情" showBack onBack={() => navigate('/results')} />
        </div>
        <div className="py-20 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-text-2">未找到该推荐</p>
          <p className="text-xs text-text-3 mt-1">可能数据已过期，请重新生成</p>
        </div>
      </AppLayout>
    );
  }

  const tierColor = TIER_COLORS[rec.tier];
  const tierName = TIER_NAMES[rec.tier];

  return (
    <AppLayout
      bottomCTA={
        <BottomCTA
          secondaryText="返回列表"
          onSecondaryClick={() => navigate('/results')}
          primaryText="加入志愿表"
          onPrimaryClick={() => {
            // MVP 阶段：暂无志愿表持久化，仅提示
          }}
        />
      }
    >
      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]">
        <NavBar title="院校详情" showBack onBack={() => navigate('/results')} />
      </div>

      {/* 渐变 Header */}
      <div
        className="px-5 py-6 text-white"
        style={{
          background:
            'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark, #E55A1E) 100%)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] px-2 py-0.5 rounded font-semibold"
                style={{ background: tierColor, color: '#fff' }}
              >
                {tierName}档
              </span>
              {rec.isNewMajor && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-medium">
                  新专业
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold leading-tight">{rec.school}</h1>
            <p className="text-base text-white/90 mt-1">{rec.major}</p>
          </div>
          <HitRateRing hitRate={rec.hitRate} tier={rec.tier} size={64} />
        </div>
        <div className="mt-3 text-sm text-white/80">
          历史命中率：<span className="font-semibold text-white">{rec.hitRate}</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* 计算依据（可折叠） */}
        <div className="bg-surface rounded-2xl border border-divider overflow-hidden">
          <button
            onClick={() => setShowCalcBasis(!showCalcBasis)}
            className="w-full px-4 py-3 flex items-center justify-between active:bg-[var(--color-divider)] transition-colors"
          >
            <span className="text-sm font-semibold text-text-1">📐 计算依据</span>
            <ChevronDown
              size={18}
              className={`text-text-3 transition-transform ${showCalcBasis ? 'rotate-180' : ''}`}
            />
          </button>
          {showCalcBasis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3.5 space-y-2.5">
                <DetailRow
                  label="位次历史区间"
                  value={`${formatNumber(rec.rankHistoryRange[0])} ~ ${formatNumber(rec.rankHistoryRange[1])}`}
                />
                <DetailRow
                  label="你的位次"
                  value={formatNumber(rec.userRank)}
                />
                <DetailRow
                  label="转换方法"
                  value={rec.conversionMethod}
                />
                <div className="pt-2 mt-1 border-t border-divider">
                  <p className="text-[11px] text-text-2 leading-relaxed">
                    基于近3年录取位次数据，采用{rec.conversionMethod}将你的位次与历史录取区间比对，
                    估算命中概率为 {rec.hitRate}。
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 风险信号 */}
        {rec.risks.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-text-1 px-1">⚠️ 风险信号</div>
            {rec.risks.map((risk, i) => (
              <RiskSignal key={i} risk={risk} />
            ))}
          </div>
        )}

        {/* AI 建议卡 */}
        <div
          className="rounded-2xl p-4"
          style={{
            background:
              'linear-gradient(135deg, var(--color-primary-light) 0%, #FFF8F0 100%)',
            border: '1px solid rgba(255, 122, 69, 0.12)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">🤖</span>
            <span className="text-sm font-semibold text-primary-dark">AI 填报建议</span>
          </div>
          <div className="space-y-2.5">
            <div>
              <div className="text-[11px] text-text-2 font-medium mb-0.5">推荐理由</div>
              <p className="text-xs text-text-1 leading-relaxed">{rec.aiAdvice}</p>
            </div>
            <div>
              <div className="text-[11px] text-text-2 font-medium mb-0.5">专业优势</div>
              <p className="text-xs text-text-1 leading-relaxed">{rec.aiAdvantage}</p>
            </div>
            <div>
              <div className="text-[11px] text-text-2 font-medium mb-0.5">填报建议</div>
              <p className="text-xs text-text-1 leading-relaxed">{rec.aiSuggestion}</p>
            </div>
          </div>
        </div>

        {/* 院校信息卡 */}
        <div className="bg-surface rounded-2xl border border-divider overflow-hidden">
          <div className="px-4 py-3 border-b border-divider">
            <span className="text-sm font-semibold text-text-1">🏫 院校信息</span>
          </div>
          <div className="px-4 py-3 space-y-2.5">
            <DetailRow label="院校层次" value={rec.schoolLevel} />
            <DetailRow label="院校性质" value={rec.schoolNature} />
            <DetailRow label="所在城市" value={rec.schoolCity} />
            <DetailRow label="学费" value={rec.tuition} />
            <DetailRow label="学制" value={rec.duration} />
            <DetailRow label="授予学位" value={rec.degree} />
          </div>
        </div>

        {/* 数据来源 */}
        <div className="text-center pb-2">
          <p className="text-xs text-text-3">
            数据来源：{rec.dataSource} · {rec.dataYear}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

/** 详情行组件 */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-2">{label}</span>
      <span className="text-sm font-medium text-text-1">{value}</span>
    </div>
  );
}
