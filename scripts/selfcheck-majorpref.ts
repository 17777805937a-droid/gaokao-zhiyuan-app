import { generateRecommendationsLocally } from '@/data/dynamic/localEngine';
import type { RecommendationRequest } from '@/types/recommendation';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} ${extra}`); }
}

function allMajors(req: RecommendationRequest): string[] {
  const r = generateRecommendationsLocally(req);
  return [...r.rush, ...r.stable, ...r.preserve, ...r.cushion].map((x) => x.major);
}

const base: RecommendationRequest = {
  provinceCode: '37',
  userRank: 23040,
  totalScore: 600,
  selectedSubjects: [],
  fillerRole: 'student',
  weightMode: 'balanced',
  schoolWeight: 34, majorWeight: 33, cityWeight: 33,
  strategyMode: 'major_priority',
  preferredMajors: [],
  preferredCities: [],
  preferredLevels: [],
};

console.log('== 测试1：设置专业偏好（仅2个）==');
const withPref = allMajors({ ...base, preferredMajors: ['计算机科学与技术', '临床医学'] });
const distinctPref = new Set(withPref);
check('所有推荐专业都来自偏好池', withPref.every((m) => m === '计算机科学与技术' || m === '临床医学'));
check('去重专业数 = 2（仅偏好）', distinctPref.size === 2, `got ${distinctPref.size}`);
check('总数 = 50', withPref.length === 50, `got ${withPref.length}`);

console.log('== 测试2：移除专业偏好（空数组）==');
const noPref = allMajors({ ...base, preferredMajors: [] });
const distinctNoPref = new Set(noPref);
check('去重专业数 > 30（退回全量池，明显多于2）', distinctNoPref.size > 30, `got ${distinctNoPref.size}`);
check('推荐专业不再局限于偏好', !noPref.every((m) => m === '计算机科学与技术' || m === '临床医学'));
check('总数 = 50', noPref.length === 50, `got ${noPref.length}`);

console.log('== 测试3：移除偏好后结果发生变化（关键回归）==');
check('设偏好 vs 移除偏好，结果不同', JSON.stringify(withPref) !== JSON.stringify(noPref));

console.log('== 测试4：单个偏好专业 ==');
const onePref = allMajors({ ...base, preferredMajors: ['人工智能'] });
check('单偏好时所有专业都为该偏好', onePref.every((m) => m === '人工智能'));

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
