/**
 * 本地兜底引擎自测（验证用，不参与生产构建）
 */
import { lookupScoreRankLocal, generateRecommendationsLocally } from '@/data/dynamic/localEngine';

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    pass++;
    console.log('  ✓', msg);
  } else {
    fail++;
    console.error('  ✗', msg);
  }
}

console.log('== 1. 位次反查（本地）==');
const r1 = lookupScoreRankLocal('37', 'physics', 600);
// 公式: factor=1.2; baseRank=round(150*(80+48)*1.2)=round(23040)=23040; countAtScore=max(round(50-9),5)=41
assert(r1.cumulativeCount === 23040, `山东物理600分位次=23040 (得到 ${r1.cumulativeCount})`);
assert(r1.countAtScore === 41, `同分人数=41 (得到 ${r1.countAtScore})`);

const r2 = lookupScoreRankLocal('37', 'history', 600);
assert(r2.cumulativeCount < r1.cumulativeCount, `历史类位次应小于物理类 (hist=${r2.cumulativeCount}, phys=${r1.cumulativeCount})`);

const r3 = lookupScoreRankLocal('11', 'physics', 650); // 北京（不在已知系数表，走默认1.0）
assert(r3.cumulativeCount > 0, `未知省份兜底位次为正 (得到 ${r3.cumulativeCount})`);

console.log('== 2. 推荐生成（本地）==');
const req = { provinceCode: '37', userRank: 23040 };
const rec = generateRecommendationsLocally(req);
const total = rec.rush.length + rec.stable.length + rec.preserve.length + rec.cushion.length;
assert(total === 50, `推荐总数=50 (得到 ${total})`);
assert(rec.rush.length === 19 && rec.stable.length === 12 && rec.preserve.length === 14 && rec.cushion.length === 5, '四档数量符合 19/12/14/5');

const allMajors = [
  ...rec.rush, ...rec.stable, ...rec.preserve, ...rec.cushion,
].map((x) => x.major);
const distinctMajors = new Set(allMajors);
console.log(`   出现专业数(去重)=${distinctMajors.size}, 样本: ${[...distinctMajors].slice(0, 6).join('、')}`);
assert(distinctMajors.size >= 40, `专业多样性充足(>=40, 得到 ${distinctMajors.size}) —— 修复"专业只有6个"`);

// 字段完整性
const sample = rec.rush[0];
assert(!!sample.school && !!sample.major && !!sample.hitRate && sample.hitRateMin <= sample.hitRateMax, '推荐项字段完整(school/major/hitRate)');
assert(sample.dataSource.includes('本地估算'), `dataSource 标注本地估算 (${sample.dataSource})`);
assert(sample.tags.length === 3, 'tags 含 院校层次/性质/城市');

// 北京省份名透传
const recBJ = generateRecommendationsLocally({ provinceCode: '11', userRank: 1000 });
assert(recBJ.rush[0].dataSource.includes('北京'), `省份名透传 (${recBJ.rush[0].dataSource})`);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);
