/**
 * 选科组合选择器（3+3 六选三 / 3+1+2 首选+再选双区）
 */


import clsx from 'clsx';
import { SUBJECTS_3_3, SUBJECTS_3_1_2 } from '@/config/constants';
import { getExamMode } from '@/utils/provinceConfig';
import { canSelectSubject, getSecondSubjects } from '@/utils/subjectRules';
import { formatSubjects } from '@/utils/format';

interface SubjectSelectorProps {
  provinceCode: string;
  subjectCategory?: string;
  selectedSubjects: string[];
  onCategoryChange?: (cat: string) => void;
  onSubjectsChange: (subjects: string[]) => void;
  coverageRate?: number;
}

export function SubjectSelector({
  provinceCode,
  selectedSubjects,
  onSubjectsChange,
  onCategoryChange,
  coverageRate = 0,
}: SubjectSelectorProps) {
  const mode = getExamMode(provinceCode);

  if (!mode) return null;

  const handleToggleSubject = (subject: string) => {
    if (!canSelectSubject(provinceCode, selectedSubjects, subject)) return;

    if (selectedSubjects.includes(subject)) {
      // 取消选择
      const newSubjects = selectedSubjects.filter((s) => s !== subject);
      onSubjectsChange(newSubjects);
      // 如果取消的是首选科目，更新 subjectCategory
      if ((subject === 'physics' || subject === 'history') && onCategoryChange) {
        onCategoryChange('');
      }
    } else {
      // 选择科目
      onSubjectsChange([...selectedSubjects, subject]);
      // 如果选了首选科目，更新 subjectCategory
      if (subject === 'physics' && onCategoryChange) {
        onCategoryChange('physics');
      } else if (subject === 'history' && onCategoryChange) {
        onCategoryChange('history');
      }
    }
  };

  // 3+3 模式
  if (mode === '3+3') {
    return (
      <div>
        <SubjectGrid
          title="选科组合"
          subtitle="6选3"
          subjects={SUBJECTS_3_3}
          selectedSubjects={selectedSubjects}
          provinceCode={provinceCode}
          onToggle={handleToggleSubject}
        />
        <SelectionSummary
          selectedSubjects={selectedSubjects}
          coverageRate={coverageRate}
        />
      </div>
    );
  }

  // 3+1+2 模式
  const firstSubjects = SUBJECTS_3_1_2.filter((s) => s.type === 'first');
  const secondSubjects = SUBJECTS_3_1_2.filter((s) => s.type === 'second');
  const selectedSecond = getSecondSubjects(selectedSubjects);

  return (
    <div>
      <SubjectGrid
        title="首选科目"
        subtitle="2选1"
        subjects={firstSubjects}
        selectedSubjects={selectedSubjects}
        provinceCode={provinceCode}
        onToggle={handleToggleSubject}
        showIcon
        bigCard
      />
      <div className="mt-4" />
      <SubjectGrid
        title="再选科目"
        subtitle={`4选2 · 已选${selectedSecond.length}/2`}
        subjects={secondSubjects}
        selectedSubjects={selectedSubjects}
        provinceCode={provinceCode}
        onToggle={handleToggleSubject}
      />
      <SelectionSummary
        selectedSubjects={selectedSubjects}
        coverageRate={coverageRate}
      />
    </div>
  );
}

// —— 子组件 ——

interface SubjectGridProps {
  title: string;
  subtitle: string;
  subjects: { value: string; label: string; icon: string; type: string }[];
  selectedSubjects: string[];
  provinceCode: string;
  onToggle: (subject: string) => void;
  showIcon?: boolean;
  bigCard?: boolean;
}

function SubjectGrid({
  title,
  subtitle,
  subjects,
  selectedSubjects,
  provinceCode,
  onToggle,
  showIcon = false,
  bigCard = false,
}: SubjectGridProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-text-1">
          {title} <span className="text-red">*</span>
        </span>
        <span className="text-xs text-text-2 font-normal">{subtitle}</span>
      </div>
      <div className={clsx('grid gap-2.5', bigCard ? 'grid-cols-2' : 'grid-cols-2')}>
        {subjects.map((s) => {
          const selected = selectedSubjects.includes(s.value);
          const canSelect = canSelectSubject(provinceCode, selectedSubjects, s.value);
          const disabled = !selected && !canSelect;

          return (
            <button
              key={s.value}
              onClick={() => onToggle(s.value)}
              disabled={disabled}
              className={clsx(
                'rounded-xl transition-all active:scale-[0.98] flex items-center justify-between',
                bigCard ? 'h-[72px] flex-col gap-1 p-3' : 'h-14 px-3.5',
                selected
                  ? 'border-2 border-primary bg-primary-light'
                  : 'border-[1.5px] border-border bg-surface',
                disabled && 'opacity-40',
              )}
            >
              {bigCard ? (
                <>
                  <span className="text-2xl">{s.icon}</span>
                  <span
                    className={clsx(
                      'text-sm font-semibold',
                      selected ? 'text-primary-dark' : 'text-text-1',
                    )}
                  >
                    {s.label}类
                  </span>
                </>
              ) : (
                <>
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      selected ? 'text-primary-dark' : 'text-text-1',
                    )}
                  >
                    {showIcon && <span className="mr-1">{s.icon}</span>}
                    {s.label}
                  </span>
                  {selected && <span className="text-primary text-base">✓</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectionSummary({
  selectedSubjects,
  coverageRate,
}: {
  selectedSubjects: string[];
  coverageRate: number;
}) {
  if (selectedSubjects.length === 0) return null;

  return (
    <div className="mt-4 bg-surface rounded-2xl p-3.5 border border-divider">
      <div className="text-xs text-text-2">已选组合</div>
      <div className="text-base font-semibold text-text-1 mt-1">
        {formatSubjects(selectedSubjects)}
      </div>
      {coverageRate > 0 && (
        <div className="mt-2.5 pt-2.5 border-t border-divider flex items-center gap-2">
          <span className="text-sm">📊</span>
          <span className="text-xs text-text-2">可报专业覆盖率：</span>
          <span className="text-base font-bold text-green">{coverageRate}%</span>
        </div>
      )}
    </div>
  );
}
