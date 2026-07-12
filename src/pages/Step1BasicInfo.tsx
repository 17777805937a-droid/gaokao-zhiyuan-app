/**
 * Step 1 基础信息 — 省份选择 + 分数输入 + 位次反查 + 身份选择
 */

import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomCTA } from '@/components/common/BottomCTA';
import { InfoTip } from '@/components/common/InfoTip';
import { CardSelector } from '@/components/common/CardSelector';
import { ProvincePicker } from '@/components/wizard/ProvincePicker';
import { ScoreInput } from '@/components/wizard/ScoreInput';
import { RankDisplay } from '@/components/wizard/RankDisplay';
import { useFormStore } from '@/store/formStore';
import { useScoreRankLookup } from '@/hooks/useScoreRankLookup';
import { getProvinceTip } from '@/utils/provinceConfig';
import { shouldShowDeviationWarning } from '@/utils/validation';
import type { FillerRole } from '@/types/form';

export default function Step1BasicInfo() {
  const navigate = useNavigate();

  // —— Store 字段 ——
  const provinceCode = useFormStore((s) => s.provinceCode);
  const subjectCategory = useFormStore((s) => s.subjectCategory);
  const totalScore = useFormStore((s) => s.totalScore);
  const provinceRank = useFormStore((s) => s.provinceRank);
  const autoRank = useFormStore((s) => s.autoRank);
  const rankRange = useFormStore((s) => s.rankRange);
  const sameScoreCount = useFormStore((s) => s.sameScoreCount);
  const rankLookupStatus = useFormStore((s) => s.rankLookupStatus);
  const fillerRole = useFormStore((s) => s.fillerRole);
  const setField = useFormStore((s) => s.setField);
  const setStep = useFormStore((s) => s.setStep);
  const setMaxCompletedStep = useFormStore((s) => s.setMaxCompletedStep);

  // —— 位次反查 Hook ——
  const { triggerLookup } = useScoreRankLookup();

  // —— 前进校验 ——
  const canProceed = !!(provinceCode && totalScore != null && provinceRank != null && fillerRole);

  const handleNext = () => {
    setStep(2);
    setMaxCompletedStep(2);
    navigate('/wizard/step2');
  };

  const provinceTip = provinceCode ? getProvinceTip(provinceCode) : '';

  return (
    <AppLayout
      showProgressBar
      step={1}
      total={4}
      stepLabel="基础信息"
      bottomCTA={
        <BottomCTA
          secondaryText="返回首页"
          onSecondaryClick={() => navigate('/')}
          primaryText="下一步"
          primaryDisabled={!canProceed}
          onPrimaryClick={handleNext}
        />
      }
    >
      <div className="px-4 py-4 space-y-5">
        {/* 省份选择 */}
        <ProvincePicker
          value={provinceCode ?? ''}
          onChange={(code) => setField('provinceCode', code)}
        />

        {/* 省份提示 */}
        {provinceTip && (
          <InfoTip type="info" title="省份规则">
            {provinceTip}
          </InfoTip>
        )}

        {/* 分数输入 */}
        <ScoreInput
          value={totalScore}
          onChange={(score) => setField('totalScore', score)}
          onBlur={() => triggerLookup()}
          provinceCode={provinceCode ?? ''}
          subjectCategory={subjectCategory ?? ''}
        />

        {/* 位次反查结果 */}
        <RankDisplay
          loading={rankLookupStatus === 'loading'}
          rank={autoRank}
          rankRange={rankRange ?? undefined}
          sameScoreCount={sameScoreCount ?? undefined}
          error={rankLookupStatus === 'error' ? '位次查询失败，请手动输入' : undefined}
          userRank={provinceRank}
          onUserRankChange={(rank) => setField('provinceRank', rank)}
          deviationWarning={shouldShowDeviationWarning(autoRank, provinceRank)}
        />

        {/* 填写者身份 */}
        <div>
          <div className="text-sm font-semibold text-text-1 mb-2">
            你的身份 <span className="text-red">*</span>
          </div>
          <CardSelector
            options={[
              { value: 'student', label: '我是考生', icon: '🎓' },
              { value: 'parent', label: '我是家长', icon: '👨‍👩‍👧' },
            ]}
            value={fillerRole ?? undefined}
            onChange={(v) => setField('fillerRole', v as FillerRole)}
            columns={2}
          />
        </div>
      </div>
    </AppLayout>
  );
}
