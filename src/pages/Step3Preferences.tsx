/**
 * Step 3 意向偏好 — 专业/地域/院校偏好 + 权重策略 + 特殊身份（全部选填可跳过）
 */

import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomCTA } from '@/components/common/BottomCTA';
import { InfoTip } from '@/components/common/InfoTip';
import { CardSelector } from '@/components/common/CardSelector';
import { TagInput } from '@/components/common/TagInput';
import { PreferenceSection } from '@/components/wizard/PreferenceSection';
import { WeightSelector } from '@/components/wizard/WeightSelector';
import { StrategySelector } from '@/components/wizard/StrategySelector';
import { useFormStore } from '@/store/formStore';
import {
  COMMON_MAJORS,
  COMMON_CITIES,
  SCHOOL_LEVELS,
  SCHOOL_NATURES,
  ECONOMIC_ZONES,
  SPECIAL_IDENTITIES,
} from '@/config/constants';
import type { WeightMode, StrategyMode } from '@/types/form';

export default function Step3Preferences() {
  const navigate = useNavigate();

  // —— Store 字段 ——
  const preferredMajors = useFormStore((s) => s.preferredMajors);
  const excludedMajors = useFormStore((s) => s.excludedMajors);
  const preferredCities = useFormStore((s) => s.preferredCities);
  const preferredEconomicZones = useFormStore((s) => s.preferredEconomicZones);
  const preferredLevels = useFormStore((s) => s.preferredLevels);
  const schoolNature = useFormStore((s) => s.schoolNature);
  const weightMode = useFormStore((s) => s.weightMode);
  const schoolWeight = useFormStore((s) => s.schoolWeight);
  const majorWeight = useFormStore((s) => s.majorWeight);
  const cityWeight = useFormStore((s) => s.cityWeight);
  const strategyMode = useFormStore((s) => s.strategyMode);
  const specialIdentity = useFormStore((s) => s.specialIdentity);
  const nationalityBonusPoints = useFormStore((s) => s.nationalityBonusPoints);
  const setField = useFormStore((s) => s.setField);
  const setStep = useFormStore((s) => s.setStep);
  const setMaxCompletedStep = useFormStore((s) => s.setMaxCompletedStep);

  const handleNext = () => {
    setStep(4);
    setMaxCompletedStep(4);
    navigate('/wizard/step4');
  };

  const handleSkip = () => {
    setStep(4);
    navigate('/wizard/step4');
  };

  return (
    <AppLayout
      showProgressBar
      step={3}
      total={4}
      stepLabel="意向偏好"
      bottomCTA={
        <BottomCTA
          secondaryText="上一步"
          onSecondaryClick={() => navigate('/wizard/step2')}
          skipText="跳过"
          onSkipClick={handleSkip}
          primaryText="下一步"
          onPrimaryClick={handleNext}
        />
      }
    >
      <div className="px-4 py-4 space-y-3">
        {/* 跳过提示 */}
        <InfoTip type="info">本步全部选填，跳过不影响推荐质量</InfoTip>

        {/* 偏好区域 1: 专业偏好 */}
        <PreferenceSection title="专业偏好" icon="📚" defaultOpen>
          <div className="space-y-4 pt-1">
            <TagInput
              label="心仪专业"
              placeholder="+ 搜索添加心仪专业"
              tags={preferredMajors}
              onAdd={(tag) => setField('preferredMajors', [...preferredMajors, tag])}
              onRemove={(tag) =>
                setField('preferredMajors', preferredMajors.filter((m) => m !== tag))
              }
              searchable
              searchOptions={COMMON_MAJORS}
            />
            <TagInput
              label="专业黑名单"
              placeholder="+ 搜索添加排斥专业"
              tags={excludedMajors}
              onAdd={(tag) => setField('excludedMajors', [...excludedMajors, tag])}
              onRemove={(tag) =>
                setField('excludedMajors', excludedMajors.filter((m) => m !== tag))
              }
              variant="danger"
              searchable
              searchOptions={COMMON_MAJORS}
            />
          </div>
        </PreferenceSection>

        {/* 偏好区域 2: 地域偏好 */}
        <PreferenceSection title="地域偏好" icon="📍">
          <div className="space-y-4 pt-1">
            <TagInput
              label="期望城市"
              placeholder="+ 搜索添加期望城市"
              tags={preferredCities}
              onAdd={(tag) => setField('preferredCities', [...preferredCities, tag])}
              onRemove={(tag) =>
                setField('preferredCities', preferredCities.filter((c) => c !== tag))
              }
              searchable
              searchOptions={COMMON_CITIES}
            />
            <div>
              <div className="text-sm font-semibold text-text-1 mb-2">经济圈偏好</div>
              <CardSelector
                options={ECONOMIC_ZONES.map((zone) => ({ value: zone, label: zone }))}
                values={preferredEconomicZones}
                multiple
                onChange={(v) => setField('preferredEconomicZones', v as string[])}
                columns={3}
              />
            </div>
          </div>
        </PreferenceSection>

        {/* 偏好区域 3: 院校偏好 */}
        <PreferenceSection title="院校偏好" icon="🏫">
          <div className="space-y-4 pt-1">
            <div>
              <div className="text-sm font-semibold text-text-1 mb-2">院校层次</div>
              <CardSelector
                options={SCHOOL_LEVELS.map((level) => ({ value: level, label: level }))}
                values={preferredLevels}
                multiple
                onChange={(v) => setField('preferredLevels', v as string[])}
                columns={3}
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-1 mb-2">院校性质</div>
              <CardSelector
                options={SCHOOL_NATURES.map((nature) => ({ value: nature, label: nature }))}
                values={schoolNature}
                multiple
                onChange={(v) => setField('schoolNature', v as string[])}
                columns={3}
              />
            </div>
          </div>
        </PreferenceSection>

        {/* 偏好区域 4: 权重与策略 */}
        <PreferenceSection title="权重与策略" icon="⚖️" defaultOpen>
          <div className="space-y-4 pt-1">
            <WeightSelector
              mode={weightMode}
              weights={{ school: schoolWeight, major: majorWeight, city: cityWeight }}
              onModeChange={(mode) => setField('weightMode', mode as WeightMode)}
              onWeightsChange={(w) => {
                setField('schoolWeight', w.school);
                setField('majorWeight', w.major);
                setField('cityWeight', w.city);
              }}
            />
            <StrategySelector
              value={strategyMode}
              onChange={(s) => setField('strategyMode', s as StrategyMode)}
              hasMajorPreference={preferredMajors.length > 0}
            />
          </div>
        </PreferenceSection>

        {/* 偏好区域 5: 特殊身份 */}
        <PreferenceSection title="特殊身份" icon="🎖️">
          <div className="space-y-3 pt-1">
            <CardSelector
              options={SPECIAL_IDENTITIES.map((si) => ({
                value: si.value,
                label: si.label,
                icon: si.icon,
              }))}
              values={specialIdentity}
              multiple
              onChange={(v) => setField('specialIdentity', v as string[])}
              columns={2}
            />
            {/* 少数民族加分输入 */}
            {specialIdentity.includes('minority') && (
              <div className="mt-3">
                <div className="text-sm font-medium text-text-1 mb-2">
                  少数民族加分分值
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={nationalityBonusPoints ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const num = raw === '' ? null : parseInt(raw, 10);
                    setField('nationalityBonusPoints', num);
                  }}
                  placeholder="请输入加分分值（如 5）"
                  className="w-full h-12 border-[1.5px] border-border rounded-lg px-4 text-base text-text-1 bg-surface focus:border-primary outline-none"
                />
              </div>
            )}
          </div>
        </PreferenceSection>
      </div>
    </AppLayout>
  );
}
