import { lookupScoreRankLocal } from '@/data/dynamic/localEngine';

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, extra = '') {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}${extra ? ' — ' + extra : ''}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}${extra ? ' — ' + extra : ''}`);
  }
}

console.log('=== 位次反查新公式自测（正态尾部分布）===');

// 山东 comprehensive
const sd730 = lookupScoreRankLocal('37', 'comprehensive', 730);
console.log(`山东 730 → 位次 ${sd730.cumulativeCount}（同分 ${sd730.countAtScore}）`);
check('山东730分位次远小于3598（不再离谱）', sd730.cumulativeCount < 500, `实际=${sd730.cumulativeCount}`);
check('山东730分位次为正整数', sd730.cumulativeCount >= 1);
check('山东730分位次标注来源=local', sd730.source === 'local');

const sd700 = lookupScoreRankLocal('37', 'comprehensive', 700);
const sd650 = lookupScoreRankLocal('37', 'comprehensive', 650);
const sd600 = lookupScoreRankLocal('37', 'comprehensive', 600);
const sd500 = lookupScoreRankLocal('37', 'comprehensive', 500);
const sd400 = lookupScoreRankLocal('37', 'comprehensive', 400);
console.log(`山东 700→${sd700.cumulativeCount}  650→${sd650.cumulativeCount}  600→${sd600.cumulativeCount}  500→${sd500.cumulativeCount}  400→${sd400.cumulativeCount}`);

// 单调性：分数越高位次越小
check('位次随分数单调下降（730<700<650<600<500<400）',
  sd730.cumulativeCount < sd700.cumulativeCount &&
  sd700.cumulativeCount < sd650.cumulativeCount &&
  sd650.cumulativeCount < sd600.cumulativeCount &&
  sd600.cumulativeCount < sd500.cumulativeCount &&
  sd500.cumulativeCount < sd400.cumulativeCount);

// 高分尾部稀薄：730 应远小于 600
check('730分位次 ≪ 600分位次（尾部稀薄）', sd730.cumulativeCount < sd600.cumulativeCount / 100);

// 同分人数：分数越高同分越少
check('同分人数随分数下降（730<600）', sd730.countAtScore < sd600.countAtScore);
check('同分人数下限>=3', sd730.countAtScore >= 3);

// 河南（考生多）同分同分位次应大于山东
const hn730 = lookupScoreRankLocal('41', 'comprehensive', 730);
console.log(`河南 730 → 位次 ${hn730.cumulativeCount}`);
check('河南730位次 > 山东730位次（河南考生更多）', hn730.cumulativeCount > sd730.cumulativeCount);

// 北京（考生少）同分同分位次应小于山东
const bj730 = lookupScoreRankLocal('11', 'comprehensive', 730);
console.log(`北京 730 → 位次 ${bj730.cumulativeCount}`);
check('北京730位次 < 山东730位次（北京考生更少）', bj730.cumulativeCount < sd730.cumulativeCount);

// 历史类应少于物理类（文科考生少）
const sd730h = lookupScoreRankLocal('37', 'history', 730);
console.log(`山东 730 历史类 → 位次 ${sd730h.cumulativeCount}`);
check('历史类位次 < comprehensive位次（文科考生少）', sd730h.cumulativeCount < sd730.cumulativeCount);

// 边界：满分/极低分不崩溃
const top = lookupScoreRankLocal('37', 'comprehensive', 750);
const low = lookupScoreRankLocal('37', 'comprehensive', 200);
check('满分位次>=1且不崩溃', top.cumulativeCount >= 1, `实际=${top.cumulativeCount}`);
check('极低分位次合理(<N)', low.cumulativeCount > sd400.cumulativeCount, `实际=${low.cumulativeCount}`);

// 未知省份兜底（默认 factor=1.0）
const unk = lookupScoreRankLocal('99', 'comprehensive', 600);
check('未知省份兜底因子=1.0 不崩溃', unk.cumulativeCount >= 1, `实际=${unk.cumulativeCount}`);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
