import { rebalanceWeights, weightSum, type Weights } from '@/utils/weight';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

console.log('— 权重自动平衡自测 —');

// 1. 基础比例分摊：从 33/34/33 拖院校到 50 → 剩余 50 按 34:33 分摊
{
  const cur: Weights = { school: 33, major: 34, city: 33 };
  const r = rebalanceWeights(cur, 'school', 50);
  check('拖院校=50 → 总和100', weightSum(r) === 100, `got ${weightSum(r)}`);
  check('拖院校=50 → 院校=50', r.school === 50);
  check('拖院校=50 → 专业+城市=50', r.major + r.city === 50, `got ${r.major + r.city}`);
  // 34:33 比例下，round(50*34/67)=25, city=25
  console.log(`     结果: 院校${r.school} / 专业${r.major} / 城市${r.city}`);
}

// 2. 拖到 0：其余按比例拿满 100
{
  const cur: Weights = { school: 60, major: 20, city: 20 };
  const r = rebalanceWeights(cur, 'school', 0);
  check('拖院校=0 → 总和100', weightSum(r) === 100, `got ${weightSum(r)}`);
  check('拖院校=0 → 院校=0', r.school === 0);
  check('拖院校=0 → 专业20:城市20 → 50/50', r.major === 50 && r.city === 50, `got ${r.major}/${r.city}`);
}

// 3. 拖到 100：其余归零
{
  const cur: Weights = { school: 33, major: 34, city: 33 };
  const r = rebalanceWeights(cur, 'major', 100);
  check('拖专业=100 → 总和100', weightSum(r) === 100, `got ${weightSum(r)}`);
  check('拖专业=100 → 院校0 城市0', r.school === 0 && r.city === 0, `got ${r.school}/${r.city}`);
}

// 4. 其余两维原本都为 0 → 均分剩余
{
  const cur: Weights = { school: 100, major: 0, city: 0 };
  const r = rebalanceWeights(cur, 'school', 40);
  check('其余为0时均分 → 总和100', weightSum(r) === 100, `got ${weightSum(r)}`);
  check('其余为0时均分 → 专业30 城市30', r.major === 30 && r.city === 30, `got ${r.major}/${r.city}`);
}

// 5. 重复拖同一维不漂移：连续拖院校 10→90→10
{
  let w: Weights = { school: 33, major: 34, city: 33 };
  w = rebalanceWeights(w, 'school', 10);
  w = rebalanceWeights(w, 'school', 90);
  w = rebalanceWeights(w, 'school', 10);
  check('反复拖同一维总和恒100', weightSum(w) === 100, `got ${weightSum(w)}`);
  check('反复拖后院校=10', w.school === 10);
  console.log(`     结果: 院校${w.school} / 专业${w.major} / 城市${w.city}`);
}

// 6. 带小数/越界输入被 clamp
{
  const cur: Weights = { school: 33, major: 34, city: 33 };
  const r1 = rebalanceWeights(cur, 'school', 150);
  check('超界150 → clamp 100', r1.school === 100 && weightSum(r1) === 100);
  const r2 = rebalanceWeights(cur, 'school', -20);
  check('负数-20 → clamp 0', r2.school === 0 && weightSum(r2) === 100);
}

// 7. 非整比例精确：60/20/20，拖院校到 33 → 剩余67按20:20均分 → 33/34/33
{
  const cur: Weights = { school: 60, major: 20, city: 20 };
  const r = rebalanceWeights(cur, 'school', 33);
  check('60/20/20 拖院校=33 → 总和100', weightSum(r) === 100, `got ${weightSum(r)}`);
  check('60/20/20 拖院校=33 → 专业34 城市33(按20:20均分+四舍五入补齐)', r.major === 34 && r.city === 33, `got ${r.major}/${r.city}`);
}

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
