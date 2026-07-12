/**
 * Step 2 选科组合 — 3+3 六选三 / 3+1+2 首选+再选 + 实时校验
 */

import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomCTA } from '@/components/common/BottomCTA';
import { InfoTip } from '@/components/common/InfoTip';
import { SubjectSelector } from '@/components/wizard/SubjectSelector';
import { useFormStore } from '@/store/formStore';
import { useSubjectValidation } from '@/hooks/useSubjectValidation';
import { getProvinceTip } from '@/utils/provinceConfig';

export default function Step2Subjects() {
  const navigate = useNavigate();

  // —— Store 字段 ——
  const provinceCode = useFormStore((s) => s.provinceCode);
  const subjectCategory = useFormStore((s) => s.subjectCategory);
  const selectedSubjects = useFormStore((s) => s.selectedSubjects);
  const setField = useFormStore((s) => s.setField);
  const setStep = useFormStore((s) => s.setStep);
  const setMaxCompletedStep = useFormStore((s) => s.setMaxCompletedStep);

  // —— 选科校验 Hook ——
  const { validation, coverageRate, isComplete } = useSubjectValidation();

  const handleNext = () => {
    setStep(3);
    setMaxCompletedStep(3);
    navigate('/wizard/step3');
  };

  const provinceTip = provinceCode ? getProvinceTip(provinceCode) : '';

  if (!provinceCode) {
    return (
      <AppLayout
        showProgressBar
        step={2}
        total={4}
        stepLabel="选科组合"
        bottomCTA={
          <BottomCTA
            secondaryText="上一步"
            onSecondaryClick={() => navigate('/wizard/step1')}
            primaryText="下一步"
            primaryDisabled
            onPrimaryClick={() => {}}
          />
        }
      >
        <div className="px-4 py-10 text-center text-text-2 text-sm">
          请先在第一步选择高考省份
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      showProgressBar
      step={2}
      total={4}
      stepLabel="选科组合"
      bottomCTA={
        <BottomCTA
          secondaryText="上一步"
          onSecondaryClick={() => navigate('/wizard/step1')}
          primaryText="下一步"
          primaryDisabled={!isComplete}
          onPrimaryClick={handleNext}
        />
      }
    >
      <div className="px-4 py-4 space-y-4">
        {/* 省份提示 */}
        {provinceTip && (
          <InfoTip type="info">{provinceTip}</InfoTip>
        )}

        {/* 选科选择器 */}
        <SubjectSelector
          provinceCode={provinceCode}
          subjectCategory={subjectCategory ?? undefined}
          selectedSubjects={selectedSubjects}
          onCategoryChange={(cat) => setField('subjectCategory', cat)}
          onSubjectsChange={(subjects) => setField('selectedSubjects', subjects)}
          coverageRate={coverageRate}
        />

        {/* 校验结果提示 */}
        {selectedSubjects.length > 0 && (
          validation.valid ? (
            <InfoTip type="success" title="选科有效">
              当前组合可报专业覆盖率：{coverageRate}%
            </InfoTip>
          ) : (
            <InfoTip type="danger" title="选科不完整">
              {validation.message}
            </InfoTip>
          )
        )}
      </div>
    </AppLayout>
  );
}
