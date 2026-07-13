/**
 * 首页 — Hero 区 + 信任卡片 + 断点续填 + 开始填报 CTA
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomCTA } from '@/components/common/BottomCTA';
import { InfoTip } from '@/components/common/InfoTip';
import { useFormStore } from '@/store/formStore';
import { useAuthStore } from '@/store/authStore';

/** 信任特性列表 */
const TRUST_FEATURES = [
  {
    icon: '🔧',
    title: '规则引擎回校验',
    desc: '选科组合实时校验，确保不漏报',
  },
  {
    icon: '🤖',
    title: '有态度AI建议',
    desc: '不只是罗列，更给出填报建议',
  },
  {
    icon: '🛡️',
    title: '滑档保障',
    desc: '冲稳保垫四档方案，不浪费每一分',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const hasDraft = useFormStore((s) => s.hasDraft);
  const currentStep = useFormStore((s) => s.currentStep);
  const loadDraft = useFormStore((s) => s.loadDraft);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleStart = () => {
    navigate('/wizard/step1');
  };

  const handleResume = () => {
    loadDraft();
    navigate(`/wizard/step${currentStep}`);
  };

  return (
    <AppLayout
      bottomCTA={
        <BottomCTA primaryText="开始填报" onPrimaryClick={handleStart} gradient />
      }
    >
      {/* 账户栏 */}
      <div className="px-5 pt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-text-1">高考志愿填报AI助手</span>
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="text-xs text-text-2 active:opacity-60"
          >
            退出 {user?.email}
          </button>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-blue font-medium active:opacity-60"
          >
            登录 / 注册
          </button>
        )}
      </div>

      {/* Hero 区 */}
      <div
        className="px-5 pt-12 pb-8"
        style={{
          background:
            'linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg) 100%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="text-3xl mb-2"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎓
          </motion.div>
          <h1 className="text-2xl font-bold text-text-1 leading-tight">
            高考志愿填报AI助手
          </h1>
          <p className="text-sm text-text-2 mt-1.5">让每一分都不浪费</p>
        </motion.div>
      </div>

      {/* 信任卡片 */}
      <div className="px-4 -mt-4">
        <div className="bg-surface rounded-2xl p-4 shadow-sm border border-divider">
          <motion.div
            className="grid grid-cols-3 gap-2"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
          >
            {TRUST_FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                className="text-center"
              >
                <div className="text-2xl mb-1.5">{feature.icon}</div>
                <div className="text-xs font-semibold text-text-1 leading-tight">
                  {feature.title}
                </div>
                <div className="text-[10px] text-text-2 mt-1 leading-snug">
                  {feature.desc}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* 断点续填卡 */}
      {hasDraft && (
        <div className="px-4 mt-3">
          <button
            onClick={handleResume}
            className="w-full rounded-2xl p-4 flex items-center justify-between active:scale-[0.99] transition-transform"
            style={{
              background:
                'linear-gradient(135deg, var(--color-primary-light) 0%, #FFF8F0 100%)',
              border: '1px solid rgba(255, 122, 69, 0.15)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div className="text-left">
                <div className="text-sm font-semibold text-primary-dark">
                  继续上次填报
                </div>
                <div className="text-xs text-text-2 mt-0.5">
                  已完成至第{currentStep}步
                </div>
              </div>
            </div>
            <span className="text-primary text-base">›</span>
          </button>
        </div>
      )}

      {/* 省份覆盖提示 */}
      <div className="px-4 mt-3">
        <InfoTip type="info" title="省份覆盖">
          已支持全国 31 个省 / 自治区 / 直辖市，第一步选好高考省份即可生成冲稳保垫方案
        </InfoTip>
      </div>

      {/* 功能介绍区 */}
      <div className="px-4 mt-6 pb-4">
        <div className="text-sm font-semibold text-text-1 mb-3">核心功能</div>
        <motion.div
          className="space-y-2.5"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.35 } } }}
        >
          <FeatureRow
            icon="📊"
            title="位次智能反查"
            desc="输入分数自动匹配省位次，支持手动修正"
          />
          <FeatureRow
            icon="⚖️"
            title="权重自定义"
            desc="院校/专业/城市三维权重，精准匹配你的诉求"
          />
          <FeatureRow
            icon="🎯"
            title="冲稳保垫四档"
            desc="AI 生成四档方案，每个志愿都有风险提示"
          />
          <FeatureRow
            icon="🤖"
            title="AI 填报建议"
            desc="不止推荐，更告诉你为什么推荐、放在第几个"
          />
        </motion.div>
      </div>
    </AppLayout>
  );
}

/** 功能介绍行 */
function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
      whileHover={{ x: 4 }}
      className="flex items-start gap-3 bg-surface rounded-xl p-3 border border-divider"
    >
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-1">{title}</div>
        <div className="text-xs text-text-2 mt-0.5">{desc}</div>
      </div>
    </motion.div>
  );
}
