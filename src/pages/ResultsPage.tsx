/**
 * 推荐结果页 — 四档 Tab 切换 + 推荐列表 + 权重摘要
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { NavBar } from '@/components/common/NavBar';
import { BottomCTA } from '@/components/common/BottomCTA';
import { TierTabs } from '@/components/recommendation/TierTabs';
import { RecCard } from '@/components/recommendation/RecCard';
import { WeightSummaryBar } from '@/components/recommendation/WeightSummaryBar';
import { useRecommendationStore } from '@/store/recommendationStore';
import { useFormStore } from '@/store/formStore';
import { TIER_CONFIGS } from '@/config/constants';
import { fireCelebration } from '@/utils/confetti';
import type { Tier, TierInfo } from '@/types/recommendation';

/** 推荐列表容器 / 子项入场动画 */
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};

export default function ResultsPage() {
  const navigate = useNavigate();

  // —— 推荐 Store ——
  const recommendations = useRecommendationStore((s) => s.recommendations);
  const activeTier = useRecommendationStore((s) => s.activeTier);
  const setActiveTier = useRecommendationStore((s) => s.setActiveTier);
  const getActiveRecommendations = useRecommendationStore((s) => s.getActiveRecommendations);

  // —— 表单 Store（权重信息） ——
  const weightMode = useFormStore((s) => s.weightMode);
  const schoolWeight = useFormStore((s) => s.schoolWeight);
  const majorWeight = useFormStore((s) => s.majorWeight);
  const cityWeight = useFormStore((s) => s.cityWeight);

  // 构建四档 Tab 信息
  const tiers: TierInfo[] = TIER_CONFIGS.map((t) => {
    const tier = t.key as Tier;
    return {
      key: tier,
      name: t.name,
      count: recommendations[tier]?.length ?? 0,
      hitRate: t.hitRateRange,
    };
  });

  const activeList = getActiveRecommendations();

  // 首次进入且已有推荐时：庆祝彩带 + 成功提示（仅触发一次）
  const celebrated = useRef(false);
  useEffect(() => {
    if (celebrated.current) return;
    const total =
      recommendations.rush.length +
      recommendations.stable.length +
      recommendations.preserve.length +
      recommendations.cushion.length;
    if (total > 0) {
      celebrated.current = true;
      fireCelebration();
      toast.success('推荐方案已生成 🎉', {
        description: '冲稳保垫四档已就绪，祝金榜题名！',
      });
    }
  }, [recommendations]);

  return (
    <AppLayout
      bottomCTA={
        <BottomCTA
          secondaryText="调整权重"
          onSecondaryClick={() => navigate('/wizard/step3')}
          primaryText="重新生成"
          onPrimaryClick={() => navigate('/wizard/step4')}
        />
      }
    >
      {/* 导航栏（sticky） */}
      <div className="sticky top-0 z-10 bg-[var(--color-bg)]">
        <NavBar title="推荐结果" showBack onBack={() => navigate('/')} />
      </div>

      {/* 权重摘要条 */}
      <div className="px-4">
        <WeightSummaryBar
          mode={weightMode}
          weights={{ school: schoolWeight, major: majorWeight, city: cityWeight }}
          onAdjust={() => navigate('/wizard/step3')}
        />
      </div>

      {/* 四档 Tab */}
      <TierTabs
        tiers={tiers}
        activeTier={activeTier}
        onChange={(tier) => setActiveTier(tier as Tier)}
      />

      {/* 推荐列表 */}
      <div className="px-4 pt-2 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTier}
            variants={listVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeList.length > 0 ? (
              activeList.map((rec) => (
                <motion.div key={rec.id} variants={itemVariants}>
                  <RecCard
                    school={rec.school}
                    major={rec.major}
                    tags={rec.tags}
                    tier={rec.tier}
                    hitRate={rec.hitRate}
                    risks={rec.risks}
                    aiAdvice={rec.aiAdvice}
                    dataSource={rec.dataSource}
                    dataYear={rec.dataYear}
                    isNewMajor={rec.isNewMajor}
                    onClick={() => navigate(`/results/detail/${rec.id}`)}
                  />
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm text-text-2">暂无推荐</p>
                <p className="text-xs text-text-3 mt-1">
                  请尝试调整权重或重新生成
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
