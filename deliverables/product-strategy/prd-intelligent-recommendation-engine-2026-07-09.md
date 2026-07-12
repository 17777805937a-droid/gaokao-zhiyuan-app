# PRD V1.0 — 考生成绩/意向采集与智能推荐引擎

| 字段 | 内容 |
|------|------|
| 文档版本 | V1.0（MVP阶段） |
| 模块名称 | 考生成绩/意向采集与智能推荐引擎 |
| 产品名称 | 高考志愿填报APP（暂定名） |
| 撰写人 | 析客（Specky） |
| 撰写日期 | 2025-07-11 |
| 审核人 | 方向明（产品总监） |
| 文档状态 | Draft — 待审核 |
| 战略定位 | 信任型决策顾问：以新高考规则引擎为基础设施，以"有态度"AI建议为核心差异化，以滑档保障机制为信任壁垒 |
| MVP试点省份 | 山东（3+3）、河北（3+1+2）、湖南（3+1+2） |

---

## 📌 TL;DR（执行摘要）

- **核心目标**：为高考志愿填报APP设计MVP阶段"考生成绩/意向采集与智能推荐引擎"模块，实现从信息采集到冲稳保垫四档推荐的全流程
- **关键决策**：8字段精简采集（必填5+选填3）、4步Wizard分步流程、7步推荐引擎流水线、"历史命中率"替代"录取概率"、垫档≥90%信任硬约束
- **差异化设计**：选科非法组合实时拦截（行业空白）、规则引擎回校验防幻觉、AI"有态度"建议文案、新增专业四参照法+风险提示
- **下一步**：采纳路线图评估建议（P1-08升级P0、时间线调整为12周），启动W1数据采集+API契约锁定

---

## 🎯 核心结论卡片

| 项目 | 内容 |
|------|------|
| 推荐方案 | 信任型决策顾问：规则引擎+有态度AI建议+滑档保障 |
| 优先级 | P0×11项（含AI建议文案升级） / P1×11项 / P2×4项 |
| 预期影响 | 2027高考季盈亏平衡6-8万用户，MVP预算50-80万 |
| 资源需求 | 12周开发周期，团队4-6人（数据2+后端2+前端2+AI1） |
| 风险等级 | 高（数据采集工期60%延期概率+季节性零容错） |
| 关键里程碑 | M1数据就绪(W4)→M2引擎就绪(W8)→M4测试通过(W11)→M5灰度(W12) |

---

## 目录

1. [用户画像与核心痛点](#1-用户画像与核心痛点)
2. [详细功能需求](#2-详细功能需求)
   - 2.1 [考生成绩与基本面采集](#21-考生成绩与基本面采集精准定位)
   - 2.2 [目标喜好与权重矩阵](#22-目标喜好与权重矩阵意向唤醒)
   - 2.3 [智能推荐引擎](#23-智能推荐引擎)
3. [用户体验与动线设计](#3-用户体验与动线设计4步wizard流程)
4. [需求池](#4-需求池p0p1p2优先级)
5. [Non-goals](#5-non-goals明确不做)
6. [时间线与里程碑](#6-时间线与里程碑)
7. [待确认问题](#7-待确认问题)

---

## 1. 用户画像与核心痛点

### 1.1 目标用户画像

#### 主要用户：高考考生（18岁，首次填报）

| 维度 | 描述 |
|------|------|
| 角色 | 填报决策的主要执行者 |
| 技术能力 | 熟悉移动端操作，习惯短交互 |
| 心理状态 | 45-50%焦虑驱动型（急于看结果）、25-30%防御验证型（反复核对）、15-20%不确定/迷茫型（不懂字段含义）、10-15%由家长代理操作 |
| 核心诉求 | 快速输入分数→立即看到推荐方案→再逐步补充偏好优化 |
| 行为特征 | 推荐结果出来后会截图→对比其他APP→咨询老师→与家长讨论→回来修改重新生成 |

#### 次要用户：考生家长（40-50岁，代理或参与填报）

| 维度 | 描述 |
|------|------|
| 角色 | 决策参与者/信息代理填写者（10-15%场景） |
| 技术能力 | 对APP操作较生疏，对专业术语理解有限 |
| 心理状态 | 高度谨慎，对推荐结果持怀疑态度，倾向多平台交叉验证 |
| 核心诉求 | 确保数据准确、推荐可信、不滑档 |

### 1.2 核心痛点

| 编号 | 痛点 | 影响 | 对应功能设计 |
|------|------|------|-------------|
| P-01 | 对自身分数定位不准：20-25%用户完全不知道"省位次"概念，30-35%知道但不知去哪查，5-10%填了但填错 | 位次错误→推荐全盘偏移→信任崩塌 | 位次由系统根据分数+省份+选科自动反查一分一段表，用户填写的位次仅作校验参考 |
| P-02 | 对地域、专业、院校盲目纠结：面对数百个专业和上千所院校无从下手 | 填报效率极低，决策瘫痪 | 分步式Wizard引导 + 权重矩阵 + 黑名单快速排除 |
| P-03 | 长表单疲劳：用户在6-8个字段后开始失去耐心，12-15个字段后放弃填写；单页10+字段直接关闭率73% | 信息采集失败，无法生成推荐 | 4步分步式Wizard，必填5-7个字段，选填3-5个，总计≤12个；Step 3全部可跳过 |
| P-04 | 对"冲稳保垫"认知偏差：用户将"稳"理解为"基本能录"（预期85%+），实际历史命中率仅40-75% | 期望落差→信任崩塌 | 统一使用"历史命中率XX-XX%"替代"录取概率XX%"，旁附计算依据和个性化风险提示 |
| P-05 | 5大信任崩塌场景：位次定位错误、选科不匹配推荐、数据陈旧、政策理解错误、多平台结果不一致 | 用户流失、口碑崩坏 | 规则引擎回校验（选科匹配/分数区间/专业代码有效性）+ 数据时效标识 + 省际差异自动提示 |
| P-06 | 垫档失误=信任生死线 | 一次垫档失误，用户永久流失 | 垫档历史命中率≥90%硬约束 + 5种数据信号风险提示 |

### 1.3 用户故事

**US-01（焦虑驱动型考生）**：作为一名刚出分的高考生，我希望只输入省份和分数就能立刻看到推荐方案，而不是填一堆表单，这样我能在焦虑中快速获得方向感。

**US-02（防御验证型考生）**：作为一名对填报非常谨慎的考生，我希望系统能实时校验我输入的位次是否合理，并在每个关键字段给出确认提示，这样我能确保信息无误。

**US-03（不确定型考生）**：作为一名对志愿填报一头雾水的考生，我希望字段旁边有简单易懂的解释，这样我不会因为不懂某个字段而卡住。

**US-04（家长代理型）**：作为替孩子填写的家长，我希望系统能区分"我是考生"和"我是家长"，并对我可能填错的关键信息（如分数、位次）做额外校验提醒。

**US-05（多平台验证型）**：作为一个会在多个APP间对比的用户，我希望推荐结果附带清晰的数据来源和计算逻辑，这样我能理解为什么推荐这些学校，也能和其他平台对比。

**US-06（保专业型考生）**：作为一个有明确专业意向的考生，我希望通过权重调节"保专业"，系统优先保证我能录到目标专业，而不是被调剂到不喜欢的专业。

---

## 2. 详细功能需求

### 2.1 考生成绩与基本面采集（精准定位）

#### 2.1.1 功能概述

采集考生基础信息、成绩数据与特殊身份，为推荐引擎提供精准输入。核心设计原则：**分数为主输入，位次系统自动反查，用户填写仅作校验参考**。必填字段5-7个，选填字段3-5个，总字段≤12个。

#### 2.1.2 字段定义

##### 字段 F-01：省份选择

| 属性 | 值 |
|------|-----|
| 字段名 | province_code |
| 字段类型 | 枚举（单选） |
| 数据类型 | VARCHAR(2) |
| 必填 | 是 |
| 取值范围 | MVP限定：37（山东）、13（河北）、43（湖南） |
| 默认值 | 根据手机号归属地/IP地址自动预选，用户可修改 |
| 存储表 | user_profile.province_code |

**交互规则：**
1. Step 1首个字段，页面加载时高亮提示"请选择你的高考省份"
2. 点击触发底部弹出ActionSheet，展示可选省份列表，每项显示省份名称+高考模式标签（如"山东 · 3+3模式"）
3. 选择后即时关闭ActionSheet，字段回填省份名称，并自动联动后续字段：
   - 3+3省份（山东）：选科模式切换为"6选3"自由组合
   - 3+1+2省份（河北/湖南）：选科模式切换为"首选物理或历史 + 再选2科"
4. 切换省份时，若后续字段已有值，弹出确认框："切换省份将清空选科和分数信息，确定切换？"
5. 每字段blur后自动保存（P0需求）

**校验逻辑：**
```
IF province_code NOT IN ('37', '13', '43'):
    SHOW_ERROR("当前省份暂未开放，MVP阶段仅支持山东、河北、湖南")
    BLOCK_NEXT_STEP
```

---

##### 字段 F-02：选科类别（物理类/历史类/综合类）

| 属性 | 值 |
|------|-----|
| 字段名 | subject_category |
| 字段类型 | 枚举（单选） |
| 数据类型 | VARCHAR(10) |
| 必填 | 是 |
| 取值范围 | 3+3省份：comprehensive（综合类，不区分物/史）；3+1+2省份：physics（物理类）/ history（历史类） |
| 联动条件 | 依赖 F-01 province_code |

**交互规则：**
1. 根据 F-01 自动适配显示模式：
   - 山东（3+3）：此字段隐藏，subject_category 固定为 'comprehensive'，直接进入具体选科选择
   - 河北/湖南（3+1+2）：显示为二选一卡片选择"物理类"或"历史类"
2. 选择后自动联动 F-03 选科组合的可选范围

**校验逻辑：**
```
IF province_code == '37':  // 山东3+3
    subject_category = 'comprehensive'  // 自动赋值，不需用户选
ELSE IF province_code IN ('13', '43'):  // 河北/湖南 3+1+2
    IF subject_category NOT IN ('physics', 'history'):
        SHOW_ERROR("请选择物理类或历史类")
        BLOCK_NEXT_STEP
```

---

##### 字段 F-03：选科组合（具体科目）

| 属性 | 值 |
|------|-----|
| 字段名 | selected_subjects |
| 字段类型 | 多选（数组） |
| 数据类型 | JSON ARRAY |
| 必填 | 是 |
| 取值范围 | 科目池：physics（物理）、chemistry（化学）、biology（生物）、history（历史）、geography（地理）、politics（政治） |
| 联动条件 | 依赖 F-01 province_code 和 F-02 subject_category |

**交互规则：**
1. 根据省份模式动态渲染选科UI：
   - **山东（3+3）**：展示6个科目卡片（物/化/生/史/地/政），用户选3个。已选2个时提示"再选1科"，选满3个时未选科目变灰
   - **河北/湖南（3+1+2）**：
     - 首选科目区：展示"物理""历史"2个卡片，单选（与 F-02 联动，选 F-02 时自动选中首选科目）
     - 再选科目区：展示4个科目卡片（化/生/地/政），用户选2个。选满2个时其余变灰
2. 点击已选科目可取消选择（取消后联动清空依赖此科目的推荐缓存）
3. 下方实时显示"你的选科可报专业覆盖率：XX%"（P1功能，MVP展示静态提示"选科确定后将自动计算可报专业范围"）

**校验逻辑（非法组合拦截）：**
```
// 通用校验
IF province_code == '37':  // 山东3+3
    IF len(selected_subjects) != 3:
        SHOW_ERROR("3+3模式需选择3门科目，当前已选{len}门")
        BLOCK_NEXT_STEP
    IF len(set(selected_subjects)) != len(selected_subjects):
        SHOW_ERROR("存在重复科目，请重新选择")
        BLOCK_NEXT_STEP

ELSE IF province_code IN ('13', '43'):  // 河北/湖南 3+1+2
    first_subject = selected_subjects ∩ {'physics', 'history'}
    IF len(first_subject) != 1:
        SHOW_ERROR("首选科目必须且只能选择物理或历史中的1门")
        BLOCK_NEXT_STEP
    second_subjects = selected_subjects - first_subject
    IF len(second_subjects) != 2:
        SHOW_ERROR("再选科目需选择2门（化学/生物/地理/政治）")
        BLOCK_NEXT_STEP
    IF len(set(second_subjects)) != len(second_subjects):
        SHOW_ERROR("再选科目存在重复，请重新选择")
        BLOCK_NEXT_STEP
    // 校验再选科目不包含物理/历史
    IF 'physics' IN second_subjects OR 'history' IN second_subjects:
        SHOW_ERROR("物理和历史为首选科目，不能再选为再选科目")
        BLOCK_NEXT_STEP
```

---

##### 字段 F-04：高考总分

| 属性 | 值 |
|------|-----|
| 字段名 | total_score |
| 字段类型 | 数字输入 |
| 数据类型 | INT |
| 必填 | 是 |
| 取值范围 | 0-750（整数） |
| 输入限制 | 仅允许数字，最大3位 |

**交互规则：**
1. 数字键盘输入，placeholder为"请输入高考总分"
2. 输入框右侧显示"满分750"灰色提示
3. 输入完成后（blur或输入3位数字），自动触发 F-05 位次反查
4. 若总分 < 批次控制线（根据省份+选科类别自动判断），显示inline警告但不阻断："你的分数低于本科批控制线{line}分，推荐结果可能以专科院校为主，是否继续？"
5. 每字段blur后自动保存（P0需求）

**校验逻辑：**
```
IF total_score IS NULL OR total_score == '':
    SHOW_ERROR("请输入高考总分")
    BLOCK_NEXT_STEP
IF total_score < 0 OR total_score > 750:
    SHOW_ERROR("分数应在0-750之间，请检查输入")
    BLOCK_INPUT
IF total_score % 1 != 0:  // 非整数
    SHOW_ERROR("请输入整数分数")
    BLOCK_INPUT

// 批次控制线校验（非阻断，仅提示）
batch_line = GET_BATCH_CONTROL_LINE(province_code, subject_category, year)
IF total_score < batch_line:
    SHOW_WARNING_INLINE("你的分数{total_score}低于本科批控制线{batch_line}分，推荐结果可能以专科批次为主")
```

---

##### 字段 F-05：省位次（省排名）

| 属性 | 值 |
|------|-----|
| 字段名 | province_rank |
| 字段类型 | 数字输入（可自动填充） |
| 数据类型 | INT |
| 必填 | 否（系统自动反查填充；用户手动填写时作为校验参考） |
| 取值范围 | 1-999999（正整数） |
| 自动补全 | 是（P0）：根据 total_score + province_code + subject_category 查询 score_rank 表 |

**交互规则：**
1. 初始状态：输入框显示"系统将根据分数自动查询"灰色占位文字
2. F-04 总分输入完成后，系统自动查询一分一段表：
   ```
   查询逻辑：
   SELECT cumulative_count, count_at_score
   FROM score_rank
   WHERE province_code = {province_code}
     AND year = {current_year}
     AND subject_category = {subject_category}
     AND score = {total_score}

   位次区间 = [cumulative_count - count_at_score + 1, cumulative_count]
   展示位次 = cumulative_count（保守参考，取区间上限）
   ```
3. 查询成功后，输入框自动填充位次值，下方显示inline提示："已根据你的分数{total_score}分自动查询到省位次约第{rank}名（同分{count_at_score}人，位次区间{min_rank}-{max_rank}）"
4. 用户可手动修改位次值。若手动输入值与系统反查值偏差超过±15%，显示警告："你输入的位次与系统反查结果偏差较大，请确认是否正确（系统反查：第{auto_rank}名）"
5. 若一分一段表中查不到对应分数（如分数过低未在统计范围内），显示："未能查到该分数对应的位次信息，请手动输入你的省位次"，输入框变为必填
6. 每字段blur后自动保存（P0需求）

**校验逻辑：**
```
// 自动反查
auto_rank = QUERY_SCORE_RANK(province_code, subject_category, total_score)
IF auto_rank IS NOT NULL:
    auto_fill(province_rank, auto_rank.cumulative_count)
    SHOW_INFO("已自动查询位次：第{auto_rank.cumulative_count}名（同分{auto_rank.count_at_score}人）")
ELSE:
    SET_REQUIRED(province_rank)  // 反查失败则变为必填
    SHOW_WARNING("未能自动查询到位次，请手动输入")

// 用户手动输入校验
IF province_rank IS PROVIDED BY USER:
    IF province_rank < 1:
        SHOW_ERROR("位次应大于0")
        BLOCK_NEXT_STEP
    IF auto_rank IS NOT NULL AND abs(province_rank - auto_rank.cumulative_count) / auto_rank.cumulative_count > 0.15:
        SHOW_WARNING("你输入的位次({user_rank})与系统反查结果({auto_rank.cumulative_count})偏差超过15%，请确认")
        // 非阻断，用户可忽略警告继续
```

---

##### 字段 F-06：填写者身份

| 属性 | 值 |
|------|-----|
| 字段名 | filler_role |
| 字段类型 | 枚举（单选） |
| 数据类型 | VARCHAR(10) |
| 必填 | 是 |
| 取值范围 | student（考生本人）、parent（家长代理） |
| 默认值 | student |

**交互规则：**
1. 展示为两个卡片选项："我是考生本人""我是家长，替孩子填写"
2. 选择 parent 时，在 F-04（总分）和 F-05（位次）字段旁增加额外提示："请仔细核对分数和位次，避免填错影响推荐准确性"
3. 此字段用于后端标记数据可信度，家长代理填写的分数/位次在推荐引擎中增加额外校验步骤

**校验逻辑：**
```
IF filler_role NOT IN ('student', 'parent'):
    SHOW_ERROR("请选择填写者身份")
    BLOCK_NEXT_STEP
```

---

##### 字段 F-07：特殊身份/加分项（选填）

| 属性 | 值 |
|------|-----|
| 字段名 | special_identity |
| 字段类型 | 多选（数组） |
| 数据类型 | JSON ARRAY |
| 必填 | 否 |
| 取值范围 | none（无）、nationality_bonus（少数民族加分）、three_special（三大专项计划：国家专项/地方专项/高校专项）、strong_base（强基计划意向）、art_sports（艺术/体育类）、other_bonus（其他加分政策） |
| 默认值 | none |

**交互规则：**
1. 展示为可多选的标签列表，默认选中"无"
2. 选择"无"时，其他选项自动取消选中且变灰
3. 取消"无"时，其他选项恢复可选
4. 选择"三大专项计划"时，展开二级选项：国家专项计划、地方专项计划、高校专项计划（可多选）
5. 选择"强基计划意向"时，展开inline提示："强基计划为单独批次填报，本系统将额外标注符合条件的强基院校，但不替代强基计划正式报名"
6. 选择"少数民族加分"时，展开数字输入框"加分分值"，placeholder"请输入加分分值（如5/10/20）"
7. 此字段在 Step 3 意向偏好页展示，非Step 1

**校验逻辑：**
```
IF 'none' IN special_identity AND len(special_identity) > 1:
    SHOW_ERROR("已选择'无'，不能同时选择其他身份")
    AUTO_DESELECT_OTHERS()

IF 'nationality_bonus' IN special_identity:
    IF bonus_points IS NULL OR bonus_points NOT IN (5, 10, 20):
        SHOW_WARNING("加分分值通常为5/10/20分，请确认")
        // 非阻断

IF 'three_special' IN special_identity AND 'art_sports' IN special_identity:
    SHOW_WARNING("三大专项计划与艺术/体育类通常不可同时享受，请确认你的身份")
    // 非阻断
```

---

##### 字段 F-08：单科成绩（选填）

| 属性 | 值 |
|------|-----|
| 字段名 | subject_scores |
| 字段类型 | 多字段数字输入 |
| 数据类型 | JSON OBJECT |
| 必填 | 否 |
| 取值范围 | 每科0-150（语数外）或0-100（选考科目），整数 |
| 展示条件 | 仅在用户展开"更多成绩信息"时显示 |

**交互规则：**
1. 默认折叠，显示文字"填写单科成绩（选填，可提高推荐精度）"
2. 展开后展示已选科目的单科成绩输入框（语文150/数学150/外语150 + 3门选考科目各100）
3. 此字段用于推荐引擎中"专业单科成绩要求"的匹配（如某些专业要求数学≥120）

**校验逻辑：**
```
FOR EACH subject IN subject_scores:
    max_score = 150 IF subject IN ('chinese', 'math', 'english') ELSE 100
    IF subject_scores[subject] < 0 OR subject_scores[subject] > max_score:
        SHOW_ERROR("{subject_name}成绩应在0-{max_score}之间")
        BLOCK_INPUT

// 总分校验：单科成绩之和应接近总分
IF sum(subject_scores.values()) != total_score AND abs(sum - total_score) > 5:
    SHOW_WARNING("单科成绩之和({sum})与总分({total_score})不一致，请核对")
    // 非阻断
```

---

#### 2.1.3 信息采集字段汇总

| 字段编号 | 字段名 | 类型 | 必填 | Wizard步骤 | 自动补全 | 备注 |
|----------|--------|------|------|-----------|----------|------|
| F-01 | 省份选择 | 枚举单选 | 是 | Step 1 | IP预选 | 联动选科模式 |
| F-02 | 选科类别 | 枚举单选 | 是 | Step 2 | F-01联动 | 山东隐藏 |
| F-03 | 选科组合 | 多选 | 是 | Step 2 | F-02联动 | 非法组合拦截 |
| F-04 | 高考总分 | 数字 | 是 | Step 1 | — | 触发位次反查 |
| F-05 | 省位次 | 数字 | 否（自动） | Step 1 | 是(P0) | 分数反查一分一段表 |
| F-06 | 填写者身份 | 枚举单选 | 是 | Step 1 | 默认student | 家长代理加校验 |
| F-07 | 特殊身份/加分 | 多选 | 否 | Step 3 | — | 展开二级选项 |
| F-08 | 单科成绩 | 多字段数字 | 否 | Step 3(折叠) | — | 提高推荐精度 |

**必填字段数：5个（F-01/F-02/F-03/F-04/F-06）**
**选填字段数：3个（F-05自动/F-07/F-08）**
**总字段数：8个**（符合≤12个的上限要求）

---

### 2.2 目标喜好与权重矩阵（意向唤醒）

#### 2.2.1 功能概述

采集考生对院校、地域、专业的偏好，并提供权重调节机制。核心设计原则：**全部可跳过，先看结果再补充偏好**。位于Wizard Step 3，预计耗时30-45秒。

#### 2.2.2 字段定义

##### 字段 P-01：院校偏好

| 属性 | 值 |
|------|-----|
| 字段名 | school_preference |
| 字段类型 | 多选（标签）+ 单选（最低层次） |
| 数据类型 | JSON OBJECT |
| 必填 | 否（可跳过） |

**子字段结构：**
```json
{
  "preferred_levels": ["985", "211", "double_first"],  // 倾向院校层次（多选）
  "school_nature": ["public", "private"],  // 公办/民办（多选，默认公办）
  "min_school_level": "undergraduate"  // 最低院校层次（单选）
}
```

**交互规则：**
1. 展示3组选择器：
   - "倾向院校层次"：多选标签（985 / 211 / 双一流 / 普通本科），默认不选
   - "院校性质"：多选标签（公办 / 民办 / 中外合办），默认选中"公办"
   - "最低院校层次"：单选下拉（本科一批 / 本科二批 / 本科批不限 / 专科也可），默认"本科批不限"
2. 每组标签下方有简短解释tooltip："985院校共39所，代表中国顶尖研究型大学"
3. 可全部跳过，跳过时默认配置：preferred_levels=[]（不限）、school_nature=['public']、min_school_level='undergraduate'

**校验逻辑：**
```
IF min_school_level == 'undergraduate' AND total_score < batch_line:
    SHOW_WARNING("你的分数低于本科批控制线，建议将最低院校层次调整为'专科也可'")
    // 非阻断
```

---

##### 字段 P-02：地域偏好

| 属性 | 值 |
|------|-----|
| 字段名 | region_preference |
| 字段类型 | 多选（标签） |
| 数据类型 | JSON OBJECT |
| 必填 | 否（可跳过） |

**子字段结构：**
```json
{
  "preferred_cities": ["北京", "上海", "杭州"],  // 期望城市（多选，最多10个）
  "excluded_cities": ["乌鲁木齐"],  // 排斥城市（多选，最多10个）
  "preferred_economic_zones": ["yangtze_river_delta", "greater_bay_area"]  // 经济圈偏好（多选）
}
```

**交互规则：**
1. 展示3个区域：
   - "期望城市/省份"：搜索式多选标签，输入文字联想匹配城市/省份，选中后显示为标签。最多10个
   - "不想去的城市/省份"：同上，最多10个
   - "经济圈偏好"：预设标签快速选择（京津冀 / 江浙沪 / 大湾区 / 成渝双城 / 长江中游 / 其他），可多选
2. 若期望城市与排斥城市有交集，即时提示："你同时选择了{city}为期望和排斥城市，请确认"
3. 可全部跳过

**校验逻辑：**
```
intersection = set(preferred_cities) ∩ set(excluded_cities)
IF len(intersection) > 0:
    SHOW_WARNING("以下城市同时在期望和排斥列表中：{intersection}，请确认")
    // 非阻断

IF len(preferred_cities) > 10:
    SHOW_ERROR("期望城市最多选择10个")
IF len(excluded_cities) > 10:
    SHOW_ERROR("排斥城市最多选择10个")
```

---

##### 字段 P-03：专业偏好

| 属性 | 值 |
|------|-----|
| 字段名 | major_preference |
| 字段类型 | 多选 + 黑名单 |
| 数据类型 | JSON OBJECT |
| 必填 | 否（可跳过） |

**子字段结构：**
```json
{
  "preferred_categories": ["08", "07"],  // 倾向一级学科大类代码（多选）
  "preferred_majors": ["080901", "080717"],  // 具体专业代码（多选）
  "excluded_majors": ["060101", "070101"]  // 绝对不读的专业黑名单（多选，硬拦截）
}
```

**交互规则：**
1. 展示3个区域：
   - "倾向专业大类"：展示13个学科门类标签（工学/理学/医学/文学/经济学/管理学/法学/教育学/农学/哲学/历史学/军事学/艺术学），可多选。选中后展开对应的二级类目（如工学→计算机类/电子信息类/机械类...）
   - "心仪专业"：搜索式多选，输入专业名称联想匹配，选中后显示为标签
   - "绝对不读的专业"：搜索式多选黑名单，醒目红色标签样式。下方提示："添加到黑名单的专业将被硬性排除，不会出现在任何推荐中"
2. 黑名单为硬拦截：推荐引擎在任何档位都不会推荐黑名单专业
3. 可全部跳过

**校验逻辑：**
```
// 黑名单与心仪专业冲突校验
intersection = set(preferred_majors) ∩ set(excluded_majors)
IF len(intersection) > 0:
    SHOW_ERROR("以下专业同时在心仪和黑名单中：{intersection}，请移除其一")

// 选科可报校验（P1功能）
FOR EACH major IN preferred_majors:
    IF NOT CHECK_SUBJECT_MATCH(selected_subjects, major, province_code):
        SHOW_WARNING("专业'{major_name}'的选科要求为{requirement}，你的选科可能不符合该专业要求")
        // 非阻断，因为可能通过专业组内调剂
```

---

##### 字段 P-04：核心诉求权重调节

| 属性 | 值 |
|------|-----|
| 字段名 | weight_matrix |
| 字段类型 | 预设模板选择 + 可选高级滑块 |
| 数据类型 | JSON OBJECT |
| 必填 | 否（默认"均衡考虑"模板） |
| 默认值 | `{"mode": "balanced", "school_weight": 33, "major_weight": 34, "city_weight": 33}` |

**交互规则（混合式方案）：**

**第一层：3个预设模板（默认展示）**

展示为3张卡片，每张卡片包含：模板名称、适用场景说明、权重配比可视化条：

| 模板 | 标识 | 适用场景说明 | 权重配比 |
|------|------|-------------|---------|
| 院校优先 | school_first | "我更看重学校名气和层次，专业可以调剂。适合未来打算考研、考公、靠学校品牌求职的考生。" | school:60% / major:20% / city:20% |
| 专业优先 | major_first | "我已有明确专业方向，宁可去层次稍低的学校也要读目标专业。适合有清晰职业规划的考生。" | school:20% / major:60% / city:20% |
| 均衡考虑 | balanced | "学校、专业、城市三者兼顾，系统按最优综合匹配度推荐。适合尚未明确方向的考生。" | school:33% / major:34% / city:33% |

1. 默认选中"均衡考虑"
2. 点击任一模板卡片即切换，卡片高亮，其他卡片变灰
3. 切换模板时，推荐结果区域显示"权重已调整，点击'重新生成'查看新方案"（MVP用点击应用后1-2秒刷新，非实时）

**第二层：高级滑块（折叠展开）**

1. 卡片下方显示文字链接"高级设置：自定义权重 →"
2. 点击展开3个滑块控件：
   - 院校权重（0-100）
   - 专业权重（0-100）
   - 城市权重（0-100）
3. 三个滑块之和必须=100，滑动一个时另外两个按比例自动调整（或提示"三者之和需为100，当前{sum}"）
4. 每个滑块下方标注效果说明：
   - 院校权重高 → "推荐结果会倾向更高层次的院校，可能出现专业调剂"
   - 专业权重高 → "推荐结果优先保证目标专业录取，院校层次可能降低"
   - 城市权重高 → "推荐结果优先匹配期望城市，可选范围可能缩小"
5. 展开高级滑块后，预设模板卡片取消高亮，标记为"自定义"
6. 滑块旁有"恢复默认"按钮，一键回到"均衡考虑"模板

**推荐结果展示：**
- 推荐结果页顶部固定显示"当前权重设置"摘要条："院校优先(60%) · 专业(20%) · 城市(20%)"
- 点击摘要条可快速跳回权重调节页

**校验逻辑：**
```
IF weight_matrix.mode == 'custom':
    total = school_weight + major_weight + city_weight
    IF total != 100:
        SHOW_ERROR("权重之和需为100，当前为{total}")
        BLOCK_APPLY
    IF school_weight == 0 AND major_weight == 0 AND city_weight == 0:
        SHOW_ERROR("至少有一个权重需大于0")
        BLOCK_APPLY
```

**推荐引擎中权重应用逻辑（伪代码）：**
```
// 对每个候选院校专业组计算综合匹配分
FOR EACH candidate IN candidate_pool:
    school_score = CALC_SCHOOL_MATCH(candidate, school_preference)  // 0-100
    major_score = CALC_MAJOR_MATCH(candidate, major_preference)     // 0-100
    city_score = CALC_CITY_MATCH(candidate, region_preference)      // 0-100

    composite_score = (school_score * school_weight
                     + major_score * major_weight
                     + city_score * city_weight) / 100

    candidate.composite_score = composite_score

// 按综合匹配分排序，在各档位内选择Top N
SORT candidate_pool BY composite_score DESC
```

---

##### 字段 P-05：保专业 vs 保院校策略选择

| 属性 | 值 |
|------|-----|
| 字段名 | strategy_mode |
| 字段类型 | 枚举（单选） |
| 数据类型 | VARCHAR(20) |
| 必填 | 否（默认 school_priority） |
| 取值范围 | school_priority（保院校型）、major_priority（保专业型） |
| 默认值 | school_priority |

**交互规则：**
1. 展示为2个单选卡片：
   - "保院校"：说明"优先确保录取到更高层次的学校，接受专业调剂。冲稳保垫按院校位次浮动。"
   - "保专业"：说明"优先确保录取到心仪专业，可能降低院校层次。冲稳保垫按专业位次浮动，幅度更保守。"
2. 此选择直接影响冲稳保垫四档的位次浮动参数（见2.3.3节）
3. 与 P-04 权重调节联动：选择"保专业"时自动推荐"专业优先"权重模板，选择"保院校"时自动推荐"院校优先"权重模板（用户可覆盖）
4. 默认选中"保院校"（更稳妥，符合大多数用户预期）

**校验逻辑：**
```
IF strategy_mode == 'major_priority' AND len(preferred_majors) == 0 AND len(preferred_categories) == 0:
    SHOW_WARNING("你选择了'保专业'策略，但未填写任何专业偏好。建议先选择心仪专业，否则该策略效果有限。")
    // 非阻断
```

---

#### 2.2.3 权重矩阵汇总

| 配置项 | 数据字段 | 默认值 | 影响范围 |
|--------|---------|--------|---------|
| 权重模板 | weight_matrix.mode | balanced | 综合匹配分计算 |
| 院校权重 | weight_matrix.school_weight | 33 | 院校层次匹配加权 |
| 专业权重 | weight_matrix.major_weight | 34 | 专业意向匹配加权 |
| 城市权重 | weight_matrix.city_weight | 33 | 地域偏好匹配加权 |
| 策略模式 | strategy_mode | school_priority | 冲稳保垫位次浮动参数 |
| 专业黑名单 | major_preference.excluded_majors | [] | 硬性排除，全档位生效 |

---

### 2.3 智能推荐引擎

#### 2.3.1 功能概述

推荐引擎是本产品的核心模块。接收用户采集信息（2.1+2.2）作为输入，经过**分流规则→候选池生成→位次转换→四档匹配→规则引擎回校验→风险信号检测→结果排序**七步流水线，输出"冲、稳、保、垫"四个梯度的院校专业组推荐列表。

**核心技术原则：**
- 结构化数据（分数线/选科/专业代码）走SQL查询，不走RAG（防幻觉）
- 非结构化数据（就业报告/政策文件）走向量+BM25混合检索
- 生成后必须规则引擎回校验（选科匹配、分数区间、专业代码有效性）
- 大模型用通义千问/Doubao API（不自训），仅用于生成"有态度"的AI建议文案，不参与结构化推荐计算

#### 2.3.2 分流规则（省份适配）

根据用户选择的省份，自动适配该省的投档规则：

```
FUNCTION determine_admission_rule(province_code):
    IF province_code == '37':  // 山东
        RETURN {
            rule_type: 'parallel',           // 平行志愿
            volunteer_unit: 'major+school',  // 志愿单位：专业+院校
            max_volunteers: 96,              // 最多96个志愿
            has_adjustment: false,           // 无专业调剂
            rank_table_type: 'unified',      // 一分一段表：统一一张表
            subject_check_level: 'major'     // 选科校验层级：专业级
        }
    ELSE IF province_code == '13':  // 河北
        RETURN {
            rule_type: 'parallel',
            volunteer_unit: 'major+school',
            max_volunteers: 96,
            has_adjustment: false,
            rank_table_type: 'split',        // 分物理/历史双表
            subject_check_level: 'major'
        }
    ELSE IF province_code == '43':  // 湖南
        RETURN {
            rule_type: 'parallel',           // 同平行志愿原则
            volunteer_unit: 'major_group',   // 志愿单位：院校专业组
            max_volunteers: 45,              // 最多45个志愿
            has_adjustment: true,            // 组内调剂
            rank_table_type: 'split',
            subject_check_level: 'group'     // 选科校验层级：专业组级
        }
```

**省际差异自动提示（交互规则）：**

| 省份 | 提示文案 | 触发时机 |
|------|---------|---------|
| 山东/河北 | "你所在省份采用'专业+院校'志愿模式，无需服从专业调剂，每个志愿都是确定的专业。" | 用户完成Step 1省份选择后 |
| 湖南 | "你所在省份采用'院校专业组'志愿模式，组内可能调剂到同组其他专业，建议查看专业组内包含的全部专业。" | 用户完成Step 1省份选择后 |

#### 2.3.3 匹配逻辑（推荐生成流水线）

##### Step 1：候选池初筛

```
FUNCTION generate_candidate_pool(user_input, admission_rule):
    // 1. 根据选科筛选可报专业/专业组
    IF admission_rule.subject_check_level == 'major':
        // 山东/河北：专业级校验
        eligible_majors = SELECT * FROM admission_plan ap
            JOIN subject_requirement sr ON ap.major_code = sr.major_code
            WHERE ap.province_code = user_input.province_code
              AND ap.year = current_year
              AND CHECK_SUBJECT_MATCH(user_input.selected_subjects, sr)
    ELSE IF admission_rule.subject_check_level == 'group':
        // 湖南：专业组级校验
        eligible_groups = SELECT * FROM admission_plan ap
            JOIN subject_requirement sr ON ap.major_group_code = sr.major_group_code
            WHERE ap.province_code = user_input.province_code
              AND ap.year = current_year
              AND CHECK_SUBJECT_MATCH(user_input.selected_subjects, sr)

    // 2. 根据批次控制线过滤
    eligible_pool = eligible_majors/groups WHERE batch_type MATCHES user_input.batch

    // 3. 根据特殊身份过滤（如三大专项计划仅限符合条件的考生）
    IF 'three_special' NOT IN user_input.special_identity:
        eligible_pool = eligible_pool WHERE NOT is_special_plan

    // 4. 专业黑名单硬拦截
    IF len(user_input.excluded_majors) > 0:
        eligible_pool = eligible_pool WHERE major_code NOT IN user_input.excluded_majors

    RETURN eligible_pool
```

##### Step 2：位次转换

对候选池中每个院校专业组/专业，利用往年数据计算等效分：

```
FUNCTION convert_rank(user_rank, province_code, subject_category, target_year):
    // 获取当年线上总人数
    current_total = GET_TOTAL_COUNT(province_code, current_year, subject_category)
    // 获取目标往年线上总人数
    target_total = GET_TOTAL_COUNT(province_code, target_year, subject_category)

    // 方法1：等比例缩放法（适用高分段）
    equivalent_rank_method1 = round(target_total / current_total * user_rank)

    // 方法2：线性插值法（适用中分段）
    expansion_factor = GET_EXPANSION_FACTOR(province_code, target_year)  // 分段扩招系数
    equivalent_rank_method2 = round(target_total / current_total * (1 - expansion_factor) * user_rank)

    // 生成等效分区间
    equivalent_score_1 = RANK_TO_SCORE(equivalent_rank_method1, province_code, target_year, subject_category)
    equivalent_score_2 = RANK_TO_SCORE(equivalent_rank_method2, province_code, target_year, subject_category)

    equivalent_score_range = [min(equivalent_score_1, equivalent_score_2), max(equivalent_score_1, equivalent_score_2)]

    RETURN equivalent_score_range
```

**MVP策略：** 同时计算等比例法和线性插值法，生成等效分区间展示。冲报取区间上限+5分，保底取区间下限-10分。

##### Step 3：四档匹配（冲稳保垫）

根据用户策略模式（保院校型/保专业型）和分段位置，应用不同的位次浮动参数：

```
FUNCTION generate_four_tiers(user_rank, candidate_pool, strategy_mode, score_segment):
    // 确定分段
    IF user_rank <= total_count * 0.10:
        score_segment = 'high'      // 高分段（前10%）
    ELSE IF user_rank <= total_count * 0.60:
        score_segment = 'mid'       // 中分段（10%-60%）
    ELSE:
        score_segment = 'low'       // 低分段（后40%）

    // 获取浮动参数（根据策略模式选择列）
    IF strategy_mode == 'school_priority':
        tier_params = {
            'rush':     {'low': -0.12, 'mid': -0.08, 'high': -0.12},  // 下浮8%-12%
            'stable':   {'all': 0.07},                                  // 上下浮动5%-7%
            'preserve': {'all': 0.18},                                  // 上浮10%-18%
            'cushion':  {'all': 0.25}                                   // 上浮20%以上
        }
    ELSE:  // major_priority
        tier_params = {
            'rush':     {'all': -0.05},   // 下浮3%-5%
            'stable':   {'all': 0.05},    // 上下浮动5%
            'preserve': {'all': 0.15},    // 上浮10%-15%
            'cushion':  {'all': 0.25}     // 上浮20%以上
        }

    // 高分段特殊处理：冲档放宽至下浮12%，注意大小年波动
    // 中分段特殊处理：冲档收紧至下浮8%，稳档占比60%，必须参考3年数据
    // 低分段特殊处理：几乎不冲，保垫上浮20-25%，优先有征集志愿传统的院校

    // 计算各档位次区间
    rush_rank_range    = [user_rank * (1 - rush_ratio), user_rank)         // 位次更小=分数更高=冲
    stable_rank_range  = [user_rank * (1 - stable_ratio), user_rank * (1 + stable_ratio)]
    preserve_rank_range = [user_rank, user_rank * (1 + preserve_ratio)]
    cushion_rank_range  = [user_rank * (1 + preserve_ratio), user_rank * (1 + cushion_ratio)]

    // 从候选池中筛选各档候选
    rush_candidates    = candidate_pool WHERE min_rank IN rush_rank_range
    stable_candidates  = candidate_pool WHERE min_rank IN stable_rank_range
    preserve_candidates = candidate_pool WHERE min_rank IN preserve_rank_range
    cushion_candidates = candidate_pool WHERE min_rank IN cushion_rank_range

    // 各档位按综合匹配分排序（应用权重矩阵）
    SORT EACH tier BY composite_score DESC

    // 分配各档数量（根据省份志愿数上限）
    IF province_code IN ('37', '13'):  // 山东/河北 96志愿
        quota = {'rush': 19, 'stable': 58, 'preserve': 14, 'cushion': 5}
    ELSE IF province_code == '43':     // 湖南 45志愿
        quota = {'rush': 9, 'stable': 27, 'preserve': 7, 'cushion': 2}

    // 取各档Top N
    final_list = {
        'rush':     rush_candidates[:19],
        'stable':   stable_candidates[:58],
        'preserve': preserve_candidates[:14],
        'cushion':  cushion_candidates[:5]
    }

    RETURN final_list
```

**四档策略参数表：**

| 档位 | 保院校型位次浮动 | 保专业型位次浮动 | 历史命中率区间 | 推荐数量配比 |
|------|-----------------|-----------------|--------------|-------------|
| 冲 | 下浮8%-12% | 下浮3%-5% | 10%-40% | 20% |
| 稳 | 上下浮动5%-7% | 上下浮动5% | 40%-75% | 60% |
| 保 | 上浮10%-18% | 上浮10%-15% | 75%-90% | 15% |
| 垫 | 上浮20%以上 | 上浮20%以上 | 90%以上 | 5% |

**分段差异化策略：**

| 分段 | 冲档策略 | 稳档策略 | 保垫策略 | 数据参考要求 |
|------|---------|---------|---------|-------------|
| 高分段（前10%） | 放宽至下浮12%，注意大小年波动 | 正常 | 正常，注意顶尖院校招生计划变动 | 至少3年数据 |
| 中分段（10%-60%） | 收紧至下浮8% | 占比60%，核心档位 | 正常 | 必须参考3年数据 |
| 低分段（后40%） | 几乎不冲（位次浮动≤3%） | 正常 | 上浮20-25%，优先有征集志愿传统的院校 | 参考2年数据+征集志愿记录 |

##### Step 4：规则引擎回校验

**生成推荐后，必须通过规则引擎回校验，校验不通过的候选项直接剔除并补充新候选：**

```
FUNCTION rule_engine_validation(candidate_list, user_input):
    FOR EACH candidate IN candidate_list:
        // 校验1：选科匹配
        IF NOT CHECK_SUBJECT_MATCH(user_input.selected_subjects, candidate.subject_requirement):
            REMOVE candidate FROM list
            LOG("选科不匹配，已剔除: {candidate}")
            CONTINUE

        // 校验2：分数区间合理性
        IF candidate.min_score > user_input.equivalent_score_range.max + 50:
            // 分数差距过大，不应出现在推荐中
            REMOVE candidate FROM list
            LOG("分数区间不合理，已剔除: {candidate}")
            CONTINUE

        // 校验3：专业代码有效性
        IF NOT VALIDATE_MAJOR_CODE(candidate.major_code, candidate.province_code, current_year):
            REMOVE candidate FROM list
            LOG("专业代码无效或已撤销，已剔除: {candidate}")
            CONTINUE

        // 校验4：招生计划存在性
        IF NOT EXISTS_IN_ADMISSION_PLAN(candidate, current_year):
            REMOVE candidate FROM list
            LOG("当年招生计划中不存在，已剔除: {candidate}")
            CONTINUE

        // 校验5：特殊身份限制
        IF candidate.is_special_plan AND NOT user_input.has_special_identity:
            REMOVE candidate FROM list
            CONTINUE

    // 剔除后若某档位数量不足，从候选池补充
    REFILL_TIER_IF_SHORT(candidate_list, candidate_pool, quota)

    RETURN validated_list
```

##### Step 5：风险信号检测

对每个推荐候选项执行5种数据信号风险检测：

```
FUNCTION detect_risk_signals(candidate, user_input):
    risks = []

    // 信号1：位次上升趋势
    IF candidate.min_rank_history[year-1] > candidate.min_rank_history[year-2] * 1.05:
        risks.append({
            type: 'rank_rising',
            level: 'warning',
            message: "该院校专业组近2年录取位次上升{pct}%，竞争加剧，冲报风险增大"
        })

    // 信号2：录取人数骤减(>20%)
    IF candidate.actual_count < candidate.actual_count_history[year-1] * 0.80:
        risks.append({
            type: 'plan_reduction',
            level: 'warning',
            message: "该专业今年招生计划较去年减少{pct}%，录取概率下降"
        })

    // 信号3：大小年波动（标准差>2000）
    rank_std = CALC_STDDEV(candidate.min_rank_history[-3:])
    IF rank_std > 2000:
        risks.append({
            type: 'big_small_year',
            level: 'warning',
            message: "该院校专业组存在明显'大小年'波动（3年位次标准差{std}），录取不确定性较大"
        })

    // 信号4：首年招生
    IF candidate.is_new_major:
        risks.append({
            type: 'first_year',
            level: 'info',
            message: "该专业为今年新增招生专业，无历史录取数据，推荐依据为推算预估值"
        })

    // 信号5：批次线边缘(±20分)
    batch_line = GET_BATCH_CONTROL_LINE(user_input.province_code, user_input.subject_category)
    IF abs(user_input.total_score - batch_line) <= 20:
        risks.append({
            type: 'batch_line_edge',
            level: 'high_warning',
            message: "你的分数处于本科批控制线边缘（±20分），存在落入专科批次的风险，建议务必填满保底志愿"
        })

    RETURN risks
```

##### Step 6：结果呈现与排序

```
FUNCTION render_recommendation(validated_list, weight_matrix):
    FOR EACH tier IN ['rush', 'stable', 'preserve', 'cushion']:
        FOR EACH candidate IN validated_list[tier]:
            // 计算历史命中率区间
            candidate.hit_rate_range = CALC_HIT_RATE(candidate, user_rank, tier)
            // 展示格式：历史命中率XX-XX%（非"录取概率"）

            // 附加风险信号
            candidate.risks = detect_risk_signals(candidate, user_input)

            // 附加AI建议文案（大模型生成，非结构化推荐）
            candidate.ai_advice = LLM_GENERATE_ADVICE(candidate, user_input, tier)
            // AI建议范围限定：优势点评、风险提示、填报策略建议
            // AI建议不涉及具体的录取概率预测或确定性承诺

            // 附加数据来源标识
            candidate.data_source = IDENTIFY_DATA_SOURCE(candidate)
            candidate.data_year = GET_LATEST_DATA_YEAR(candidate)

    RETURN formatted_recommendation
```

#### 2.3.4 异常与边界处理

##### 场景一：分数处于断层/边缘，无法匹配到符合所有喜好的学校

**触发条件：** 用户分数处于批次线边缘（±20分），或用户设置的偏好过于严格导致候选池在各档位均不足。

**降级提示策略（分3级）：**

```
FUNCTION handle_insufficient_candidates(candidate_list, user_input):
    // 检查各档位是否充足
    insufficient_tiers = []
    FOR EACH tier IN ['rush', 'stable', 'preserve', 'cushion']:
        IF len(candidate_list[tier]) < quota[tier] * 0.5:  // 不足配比的50%
            insufficient_tiers.append(tier)

    IF len(insufficient_tiers) == 0:
        RETURN  // 正常展示

    // Level 1：偏好降级提示
    IF len(insufficient_tiers) > 0 AND user_input.has_preferences:
        SHOW_NOTICE(
            "当前匹配结果较少，可能是因为你的偏好范围较窄。",
            actions: [
                "放宽偏好设置（推荐）",
                "查看当前有限结果",
                "切换为'保院校'策略"
            ]
        )
        // 用户选择"放宽偏好设置"后，系统自动执行：
        // 1. 移除院校层次限制（如不限985/211）
        // 2. 扩大地域范围（如从指定城市扩展到全省/全国）
        // 3. 放宽专业偏好（仅保留黑名单）
        // 每次放宽后重新生成推荐

    // Level 2：跨批次提示
    IF user_input.total_score < batch_line + 20 AND user_input.total_score > batch_line - 20:
        SHOW_WARNING(
            "你的分数({total_score})处于本科批控制线({batch_line})边缘，" +
            "建议同时填报专科批次作为保底。系统已为你生成本科+专科混合推荐方案，" +
            "请在推荐结果中查看专科批次保底选项。"
        )
        // 自动在垫档位置补充专科院校

    // Level 3：分数断层处理
    IF user_input.total_score < batch_line - 20:
        SHOW_NOTICE(
            "你的分数({total_score})低于{province}本科批控制线({batch_line})，" +
            "本科批次可报考的院校较少。系统已为你生成以专科院校为主的推荐方案，" +
            "同时标注了少量可能征集志愿降分录取的本科院校供参考。",
            actions: [
                "查看推荐方案",
                "了解征集志愿政策"
            ]
        )
```

**边界规则：**
- 若垫档候选不足配比，**绝对优先保证垫档数量**（从保档中降级补充），因为垫档是信任生死线
- 若整体候选池<10个，展示全部候选并提示"符合你条件的院校较少，建议放宽偏好"
- 若候选池为空（极端情况），展示"暂未找到匹配的院校，请联系客服人工咨询"并提供在线客服入口

##### 场景二：招生计划中新增专业（无历史分数）的推荐逻辑

**触发条件：** admission_plan 表中 is_new_major = true 的专业/专业组。

**处理策略（四种参照法）：**

```
FUNCTION handle_new_major(new_major, user_input):
    // 每年新增专业布点约占总布点3-5%，试点省份约4-6%

    // 方法1：同院校同门类参照法
    ref_score_1 = SELECT avg(min_score) FROM score_line
        WHERE school_code = new_major.school_code
          AND major_category = new_major.major_category
          AND year = current_year - 1
          AND major_code != new_major.major_code  // 排除自身

    // 方法2：同层次院校同专业参照法
    school_level = GET_SCHOOL_LEVEL(new_major.school_code)
    ref_score_2 = SELECT avg(min_score) FROM score_line sl
        JOIN school_info si ON sl.school_code = si.school_code
        WHERE si.school_level = school_level
          AND sl.major_code = new_major.major_code
          AND sl.year = current_year - 1

    // 方法3：院校投档线兜底法
    ref_score_3 = SELECT min_score FROM score_line
        WHERE school_code = new_major.school_code
          AND batch_type = new_major.batch_type
          AND year = current_year - 1
          ORDER BY min_score ASC LIMIT 1  // 院校最低投档线

    // 方法4：首年招生降位预估法
    // 首年招生通常录取位次略低于同层次已有专业，降位幅度约5-10%
    ref_score_4 = ref_score_2 * 0.95  // 降5%预估

    // 综合预估：取四种方法的加权平均，生成预估区间
    estimated_scores = [ref_score_1, ref_score_2, ref_score_3, ref_score_4]
    estimated_range = [min(estimated_scores) - 5, max(estimated_scores) + 5]

    RETURN {
        estimated_score_range: estimated_range,
        method: 'multi_reference',
        confidence: 'low',  // 置信度标记为低
        is_new: true
    }
```

**展示规则：**
1. 新增专业在推荐列表中标注醒目标识："新增专业 · 无历史数据"
2. 展示推荐依据和推算逻辑（折叠展开）：
   - "推荐依据：综合参考同院校同门类专业（{school}的{category}类）录取分、同层次院校同专业录取分、院校最低投档线，并按首年招生降位预估。"
3. **不给出确定性预测**，仅展示预估区间：预估录取分{min}-{max}分
4. 附加风险提示："此专业为今年新增，预估数据仅供参考，实际录取情况可能偏差较大。建议放在稳档或冲档，不宜作为保底志愿。"
5. 建议放在稳档或冲档，**禁止放入垫档**（规则引擎强制校验）

```
// 规则引擎中新增专业档位限制
IF candidate.is_new_major AND tier == 'cushion':
    REMOVE candidate FROM cushion_tier
    MOVE_TO stable_or_rush_tier(candidate)
    LOG("新增专业不可作为垫档志愿，已调整至稳档/冲档")
```

#### 2.3.5 命名规范与概率呈现

**强制命名规范（全产品统一）：**
- ✅ 使用："历史命中率 XX-XX%"
- ❌ 禁用："录取概率 XX%"
- ❌ 禁用："录取几率 XX%"
- ❌ 禁用："概率 XX%"

**概率呈现规则：**
1. 每个推荐项展示"历史命中率 XX-XX%"区间值（非单点值）
2. 旁附"计算依据"折叠区，展示：
   - "近3年该院校专业组录取位次区间：{min_rank}-{max_rank}"
   - "你的位次：第{user_rank}名"
   - "同位次段历史命中率：{hit_rate}%（基于近3年数据）"
3. 附加个性化风险提示（基于风险信号检测结果）

---

## 3. 用户体验与动线设计（4步Wizard流程）

### 3.1 设计原则

| 原则 | 说明 | 依据 |
|------|------|------|
| 分步降低疲劳 | 4步分步式Wizard，单步字段≤4个 | 单页10+字段关闭率73%，4步分步完成率69% |
| 必填精简 | 必填5-7个字段，选填3-5个 | 用户6-8字段后失去耐心 |
| 先结果后偏好 | Step 3全部可跳过，满足焦虑型用户"先看结果"的急迫心理 | 45-50%用户焦虑驱动型 |
| 自动补全优先 | 能系统反查的不让用户手动填 | 20-25%用户不知位次概念 |
| 自动保存 | 每字段blur后自动保存，支持微信登录跨设备同步 | P0需求 |
| 进度可见 | 进度条显示步骤名称+"只剩X步"提示 | 降低放弃率 |

### 3.2 Wizard流程详解

#### Step 1：基础信息（3-4个字段，20-30秒）

**页面标题：** "填写基础信息，开始你的志愿规划"
**进度条：** "第1步/共4步 · 基础信息"
**副标题：** "只需30秒，系统将自动为你查询省位次"

**字段顺序与布局：**

```
┌─────────────────────────────────────┐
│  ▓▓░░░░  第1步/共4步 · 基础信息       │
│                                     │
│  你的高考省份 *                      │
│  [山东 · 3+3模式 ▼]                 │  ← F-01 省份选择
│                                     │
│  高考总分 *            满分750       │
│  [        分]                       │  ← F-04 高考总分
│                                     │
│  ┌─ 自动查询结果 ────────────────┐   │
│  │ ✅ 省位次：约第 12,580 名      │   │  ← F-05 位次自动反查
│  │ （同分38人，位次区间12543-12580）│   │
│  │ [手动修改位次]                 │   │
│  └───────────────────────────────┘   │
│                                     │
│  我是 *                             │
│  [👤 考生本人]  [👨‍👩‍👧 家长代理]      │  ← F-06 填写者身份
│                                     │
│              [下一步 →]             │
│                                     │
│  💡 只剩3步，马上就能看到推荐方案     │
└─────────────────────────────────────┘
```

**交互细节：**
1. 省份选择后自动联动显示高考模式标签
2. 分数输入完成（blur），1-2秒内自动反查位次并展示在下方信息卡片中
3. 位次反查动画：显示loading→"正在查询省位次..."→展示结果
4. 若位次反查失败，信息卡片变为输入框，提示手动输入
5. 选择"家长代理"后，分数和位次字段旁出现额外提示
6. "下一步"按钮在必填字段未完成时为灰色不可点击
7. 每字段blur后自动保存到本地+云端（如已登录）

**Step 1 → Step 2 前置校验：**
```
CHECK:
  - province_code 已选择 ✓
  - total_score 已输入且在0-750范围 ✓
  - province_rank 已填充（自动或手动）✓
  - filler_role 已选择 ✓
IF ALL PASS:
    ENABLE "下一步" 按钮
```

---

#### Step 2：选科组合（2-3个字段，15-20秒）

**页面标题：** "选择你的选科组合"
**进度条：** "第2步/共4步 · 选科信息"
**副标题：** "选科决定了你能报考的专业范围"

**布局（根据省份动态适配）：**

**山东（3+3）布局：**
```
┌─────────────────────────────────────┐
│  ▓▓▓░░░  第2步/共4步 · 选科信息       │
│                                     │
│  你的选科组合 *（请选择3门）          │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 物理  │ │ 化学  │ │ 生物  │        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ 历史  │ │ 地理  │ │ 政治  │        │
│  └──────┘ └──────┘ └──────┘        │
│                                     │
│  已选：物理、化学、生物（3/3）        │
│  💡 你的选科可报专业覆盖率：约 96.5%  │  ← P1功能
│                                     │
│              [上一步] [下一步 →]     │
│  💡 只剩2步，马上就能看到推荐方案     │
└─────────────────────────────────────┘
```

**河北/湖南（3+1+2）布局：**
```
┌─────────────────────────────────────┐
│  ▓▓▓░░░  第2步/共4步 · 选科信息       │
│                                     │
│  首选科目 *（2选1）                   │
│  ┌──────────────┐ ┌──────────────┐  │
│  │  ⚡ 物理类    │ │  📖 历史类    │  │  ← F-02 选科类别
│  └──────────────┘ └──────────────┘  │
│                                     │
│  再选科目 *（4选2）                   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │ 化学  │ │ 生物  │ │ 地理  │ │ 政治  ││  ← F-03 选科组合
│  └──────┘ └──────┘ └──────┘ └──────┘│
│                                     │
│  已选：物理 + 化学、生物              │
│  💡 你的选科可报专业覆盖率：约 95.2%  │  ← P1功能
│                                     │
│              [上一步] [下一步 →]     │
│  💡 只剩2步，马上就能看到推荐方案     │
└─────────────────────────────────────┘
```

**交互细节：**
1. 山东模式：直接展示6科卡片，选满3科后其余变灰
2. 3+1+2模式：首选科目选择后联动再选科目区（已选的首选科目在再选区不出现）
3. 选科组合下方实时展示可报专业覆盖率（P1，MVP显示静态提示文字）
4. 非法组合即时拦截（见 F-03 校验逻辑）
5. 湖南省份额外提示："你所在省份采用院校专业组模式，选科将按专业组级别校验"

---

#### Step 3：意向偏好（3-4个字段，30-45秒，可全部跳过）

**页面标题：** "你的偏好（可选，跳过也可生成方案）"
**进度条：** "第3步/共4步 · 意向偏好"
**副标题：** "填写偏好可获得更精准的推荐，也可跳过直接生成"

**布局：**
```
┌─────────────────────────────────────┐
│  ▓▓▓▓░  第3步/共4步 · 意向偏好        │
│                                     │
│  ⚠️ 本页全部可跳过，不影响方案生成     │
│                                     │
│  📌 绝对不读的专业（黑名单）           │  ← P-03 专业黑名单
│  [搜索添加专业...]                    │
│  已添加：[✕ 哲学] [✕ 考古学]          │
│                                     │
│  📍 地域偏好                          │  ← P-02 地域偏好
│  期望城市：[北京] [上海] [+]           │
│  不想去：[+]                          │
│  经济圈：[江浙沪] [大湾区] [+]         │
│                                     │
│  🏫 院校层次                          │  ← P-01 院校偏好
│  倾向：[985] [211] [双一流] [+]       │
│  最低层次：[本科批不限 ▼]              │
│                                     │
│  ⚖️ 核心诉求（权重）                  │  ← P-04 权重调节
│  ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │院校优先  │ │专业优先  │ │均衡考虑 ││
│  │60/20/20  │ │20/60/20  │ │33/34/33 ││
│  └──────────┘ └──────────┘ └────────┘│
│  [高级设置：自定义权重 →]             │
│                                     │
│  🎯 填报策略                          │  ← P-05 策略选择
│  [保院校] [保专业]                    │
│                                     │
│  📋 特殊身份/加分（选填）             │  ← F-07 特殊身份
│  [无] [少数民族] [三大专项] [+]       │
│                                     │
│  [上一步]  [⏭ 跳过本步]  [下一步 →]   │
│  💡 最后1步！确认信息即可生成方案      │
└─────────────────────────────────────┘
```

**交互细节：**
1. 页面顶部醒目提示"全部可跳过"
2. 提供"跳过本步"按钮，点击后直接进入Step 4，所有偏好使用默认值
3. 所有字段均为选填，填写后实时保存
4. 权重调节采用预设模板+高级滑块混合式方案（见 P-04）
5. 策略选择与权重联动（选"保专业"自动推荐"专业优先"模板）
6. 专业黑名单为硬拦截，添加后立即在推荐中排除
7. 单科成绩（F-08）在底部折叠区域，需展开填写

---

#### Step 4：确认&生成（10-15秒）

**页面标题：** "确认信息，生成你的专属方案"
**进度条：** "第4步/共4步 · 确认生成"
**副标题：** "请核对以下信息，确认后一键生成推荐方案"

**布局：**
```
┌─────────────────────────────────────┐
│  ▓▓▓▓▓  第4步/共4步 · 确认生成        │
│                                     │
│  📋 信息确认                          │
│  ┌───────────────────────────────┐   │
│  │ 省份：山东（3+3模式）    [修改]│   │
│  │ 选科：物理+化学+生物     [修改]│   │
│  │ 总分：623分              [修改]│   │
│  │ 位次：约第12,580名       [修改]│   │
│  │ 身份：考生本人           [修改]│   │
│  ├───────────────────────────────┤   │
│  │ 偏好：                    [修改]│   │
│  │  · 院校：倾向985/211         │   │
│  │  · 地域：期望北京/上海        │   │
│  │  · 专业黑名单：哲学、考古学   │   │
│  │  · 权重：均衡考虑(33/34/33)  │   │
│  │  · 策略：保院校              │   │
│  └───────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ⚡ 一键生成推荐方案         │    │
│  └─────────────────────────────┘    │
│                                     │
│  💡 生成约需3-5秒，请稍候             │
└─────────────────────────────────────┘
```

**交互细节：**
1. 单页概览所有已填信息，每项右侧有"修改"链接，点击跳回对应Step
2. 跳回修改后返回Step 4，信息自动更新
3. "一键生成推荐方案"大按钮，点击后：
   - 显示全屏loading动画（3-5秒）："正在为你匹配最优方案..."
   - loading文字轮播："正在查询一分一段表..." → "正在计算等效分..." → "正在匹配冲稳保垫..." → "正在校验选科与专业..." → "即将完成..."
4. 生成完成后自动跳转推荐结果页
5. 推荐结果页顶部固定显示权重摘要条

### 3.3 自动保存机制

| 触发时机 | 保存内容 | 存储位置 |
|----------|---------|---------|
| 每字段blur | 当前字段值 | 本地Storage + 云端（如已登录） |
| 每步完成 | 整步数据快照 | 本地Storage + 云端 |
| 页面关闭/后台 | 全部已填数据 | 本地Storage |
| 微信登录 | 全部已填数据 | 云端（跨设备同步） |

**断点续填：** 用户中途退出后重新打开APP，自动恢复到上次填写的步骤，已填字段自动回填。

### 3.4 自动反查补全清单

| 优先级 | 数据项 | 反查输入 | 反查逻辑 | 展示方式 |
|--------|--------|---------|---------|---------|
| P0 | 省位次 | 分数+省份+选科类别 | 查score_rank表→返回cumulative_count | 自动填充+信息卡片 |
| P0 | 批次控制线 | 省份+选科类别+年份 | 查batch_control_line→返回控制线分数 | inline提示 |
| P1 | 选科可报专业范围 | 选科组合+省份 | 查subject_requirement表→计算覆盖率 | 百分比提示 |
| P1 | 专业组内包含专业 | 院校专业组代码 | 查admission_plan表→返回组内专业列表 | 展开查看 |
| P2 | 加分后等效分 | 加分分值+总分 | 简单加法计算 | inline提示 |
| P2 | 选科对应专业覆盖率 | 选科组合 | 统计subject_requirement匹配比例 | 百分比提示 |

---

## 4. 需求池（P0/P1/P2优先级）

### P0 — MVP必须交付

| 编号 | 需求名称 | 描述 | 验收标准 |
|------|---------|------|---------|
| P0-01 | 省份选择与规则适配 | 用户选择省份后自动适配该省高考模式、志愿单位、投档规则 | Given用户在Step 1选择山东 When省份选择完成 Then系统自动标记为3+3模式，后续选科UI展示6选3，且提示"专业+院校模式，无需服从调剂" |
| P0-02 | 选科组合采集与非法组合拦截 | 采集用户选科，拦截非法组合 | Given用户选择山东 When用户选择4门科目 Then即时提示"3+3模式需选择3门科目"并阻止继续 |
| P0-03 | 分数输入与位次自动反查 | 用户输入分数后系统自动查询一分一段表返回位次 | Given用户输入总分623分且省份为山东 When分数输入完成 Then2秒内自动查询并展示"省位次约第12,580名" |
| P0-04 | 4步Wizard分步式流程 | 分4步采集信息，每步字段≤4，Step 3可跳过 | Given用户进入信息采集 When完成Step 1 Then自动进入Step 2，进度条显示"第2步/共4步" |
| P0-05 | 自动保存与断点续填 | 每字段blur后自动保存，支持退出后恢复 | Given用户填到Step 2 When用户关闭APP后重新打开 Then自动恢复到Step 2，已填字段回填 |
| P0-06 | 冲稳保垫四档推荐生成 | 根据用户输入生成四档推荐列表，配比20%/60%/15%/5% | Given用户完成信息采集并点击生成 When推荐生成完成 Then展示冲档19个/稳档58个/保档14个/垫档5个（山东96志愿模式） |
| P0-07 | 规则引擎回校验 | 推荐生成后校验选科匹配、分数区间、专业代码有效性 | Given推荐列表包含某专业 When该专业选科要求为"物理+化学"且用户选科不含化学 Then该专业被剔除且不在推荐列表中 |
| P0-08 | 历史命中率呈现（非录取概率） | 统一使用"历史命中率XX-XX%"，附计算依据 | Given推荐结果展示 When用户查看任一推荐项 Then显示"历史命中率 45-65%"而非"录取概率"，且可展开查看计算依据 |
| P0-09 | 专业黑名单硬拦截 | 用户添加的专业黑名单在所有档位推荐中排除 | Given用户将"哲学"加入黑名单 When推荐生成完成 Then推荐列表中不包含任何哲学相关专业 |
| P0-10 | 新增专业标识与风险提示 | 新增专业标注"无历史数据"标识，展示推算逻辑，禁止放入垫档 | Given推荐列表包含新增专业 When用户查看该专业 Then显示"新增专业·无历史数据"标识和预估区间，且该专业不在垫档中 |
| P0-11 | 权重调节（预设模板） | 提供3个预设权重模板（院校优先/专业优先/均衡考虑） | Given用户在Step 3看到权重选择 When选择"专业优先"模板 Then权重配比变为20/60/20，推荐结果按新权重生成 |
| P0-12 | 省际差异自动提示 | 根据省份自动提示投档规则差异 | Given用户选择湖南 When省份选择完成 Then显示"院校专业组模式，组内可能调剂"提示 |
| P0-13 | 垫档信任保障 | 垫档历史命中率≥90%硬约束 | Given推荐生成垫档 When某候选项历史命中率<90% Then该候选项不进入垫档，系统从保档中降级补充 |

### P1 — MVP增强（资源允许时交付）

| 编号 | 需求名称 | 描述 | 验收标准 |
|------|---------|------|---------|
| P1-01 | 权重高级滑块 | 在预设模板基础上提供3个自定义权重滑块 | Given用户展开"高级设置" When拖动院校权重滑块至60 Then专业和城市权重自动调整为20/20，推荐按自定义权重生成 |
| P1-02 | 选科可报专业覆盖率 | 实时展示当前选科组合的可报专业百分比 | Given用户选择物理+化学+生物 When选科完成 Then显示"可报专业覆盖率：约96.5%" |
| P1-03 | 单科成绩采集 | 采集单科成绩用于专业单科要求匹配 | Given用户展开"更多成绩信息" When填写数学130分 When推荐引擎遇到要求数学≥120的专业 Then该专业获得额外匹配加分 |
| P1-04 | 5种风险信号检测 | 检测位次上升/招生骤减/大小年/首年招生/批次线边缘5种信号 | Given某院校近2年位次上升15% When该院校出现在推荐中 Then展示风险提示"近2年录取位次上升15%，冲报风险增大" |
| P1-05 | 位次手动输入校验 | 用户手动输入位次与系统反查偏差>15%时警告 | Given系统反查位次为12580 When用户手动输入8000 Then展示"偏差超过15%，请确认"警告 |
| P1-06 | 分数断层/边缘降级提示 | 分数处于批次线边缘时提供3级降级提示 | Given用户分数=批次线-5分 When推荐生成 Then展示"你的分数处于本科批控制线边缘，建议同时填报专科批次保底"提示 |
| P1-07 | 特殊身份/加分项采集 | 采集三大专项、强基计划、少数民族加分等 | Given用户选择"少数民族加分10分" When推荐生成 Then推荐引擎在等效分计算中加入10分加分 |
| P1-08 | 推荐结果AI建议文案 | 大模型生成"有态度"的填报建议文案 | Given推荐结果展示 When用户查看某推荐项 Then展示AI生成的优势点评和风险提示文案（非录取概率预测） |

### P2 — 后续迭代

| 编号 | 需求名称 | 描述 | 验收标准 |
|------|---------|------|---------|
| P2-01 | 加分后等效分计算 | 自动计算加分后的等效分并展示 | Given用户有10分加分 When推荐生成 Then展示"加分后等效分633分" |
| P2-02 | 权重实时刷新 | 滑块调节时实时刷新推荐结果（非点击应用后刷新） | Given用户拖动权重滑块 When松手 Then推荐结果在1秒内自动刷新 |
| P2-03 | 征集志愿标注 | 标注有征集志愿传统的院校 | Given低分段用户查看推荐 When某院校有连续3年征集志愿记录 Then标注"该院校近年有征集志愿传统" |
| P2-04 | 专业就业方向展示 | 展示专业就业方向和薪资数据 | Given用户查看某专业推荐 When展开详情 Then展示就业方向、平均薪资、就业率数据 |
| P2-05 | 跨设备同步 | 微信登录后跨设备同步采集数据 | Given用户在手机端填到Step 3 When用户在平板端登录同一微信 Then自动恢复到Step 3 |

---

## 5. Non-goals（明确不做）

| 编号 | 不做内容 | 原因 |
|------|---------|------|
| NG-01 | 不做录取概率的精确预测 | 录取受太多不确定因素影响，精确预测是虚假承诺，与"信任型决策顾问"定位冲突 |
| NG-02 | 不做自训大模型 | MVP阶段使用通义千问/Doubao API，不自训模型，控制成本和迭代速度 |
| NG-03 | 不做非试点省份 | MVP仅支持山东、河北、湖南三省，不铺开全国 |
| NG-04 | 不做专科批次完整推荐 | MVP以本科批次为主，专科仅在批次线边缘时作为保底补充 |
| NG-05 | 不做艺术/体育类完整推荐 | 艺术体育类录取规则复杂（文化课+专业课双线），MVP仅采集身份标记，不做专门推荐 |
| NG-06 | 不做实时权重刷新 | MVP权重调节后需点击"应用"刷新（1-2秒），不做滑块拖动时实时刷新（P2） |
| NG-07 | 不做志愿填报模拟器 | MVP只做推荐生成，不提供模拟填报和投档模拟功能 |
| NG-08 | 不做多角色协作填报 | MVP不支持考生+家长多账号协作填报同一份方案 |
| NG-09 | 不做付费功能 | MVP全免费，不做付费墙和增值服务（与夸克/百度等免费产品竞争需要） |
| NG-10 | 不做线下机构对接 | MVP不提供一对一咨询和线下机构转介绍 |

---

## 6. 时间线与里程碑

### MVP开发周期：8周

| 里程碑 | 时间 | 交付内容 | 验收标准 |
|--------|------|---------|---------|
| M1：需求冻结 | W1结束 | PRD V1.0评审通过、设计稿确认 | PRD评审无P0级open question，设计稿覆盖全部P0需求 |
| M2：数据层完成 | W3结束 | 6张核心数据表建表、3省近3年数据导入、一分一段表查询接口 | 山东/河北/湖南三省数据完整率>98%，位次反查接口响应<500ms |
| M3：推荐引擎完成 | W5结束 | 候选池生成、位次转换、四档匹配、规则引擎回校验 | 推荐生成全流程<5秒，回校验通过率100%（不合规项全部剔除） |
| M4：前端Wizard完成 | W6结束 | 4步Wizard全流程、自动保存、断点续填 | 4步流程完成率>69%，单步字段≤4，自动保存成功率>99% |
| M5：联调与测试 | W7结束 | 前后端联调、3省测试用例覆盖、性能测试 | 3省各100组测试用例通过率>95%，推荐生成<5秒 |
| M6：灰度发布 | W8结束 | 3省灰度发布、用户反馈收集、紧急修复 | 灰度用户100人，NPS>40，无P0级bug |

### 依赖项

| 依赖 | 负责方 | 交付时间 | 风险 |
|------|--------|---------|------|
| 3省历史数据采集与清洗 | 数据团队 | W2结束 | 数据获取延迟（阳光高考/各省考试院数据发布时间不一） |
| 一分一段表接口开发 | 后端团队 | W3结束 | 接口性能（高频查询场景） |
| 通义千问/Doubao API接入 | 后端团队 | W4结束 | API调用频率限制、响应延迟 |
| UI设计稿交付 | 设计团队 | W2结束 | 设计稿评审周期 |
| 选科要求数据校验 | 数据团队 | W3结束 | 选科要求数据的准确性（直接影响推荐正确性） |

---

## 7. 待确认问题

| 编号 | 问题 | 影响范围 | 建议决策方 | 紧急程度 |
|------|------|---------|-----------|---------|
| Q-01 | 当年一分一段表尚未发布时（如6月25日前），位次反查如何处理？是否使用上年数据估算并标注？ | P0-03 位次反查 | 产品+数据 | 高（影响核心流程） |
| Q-02 | 推荐结果生成后，用户修改偏好重新生成的频率限制？是否需要防抖/冷却时间？ | P0-06 推荐生成 | 产品 | 中 |
| Q-03 | 通义千问/Doubao API生成的AI建议文案，是否需要人工审核机制？还是全自动化发布？ | P1-08 AI建议 | 产品+法务 | 中（涉及合规风险） |
| Q-04 | 招生计划数据每年更新（通常6月发布），若用户在数据更新前使用，是否标注"基于上年招生计划"？ | P0-06 推荐生成 | 产品+数据 | 高（影响数据准确性） |
| Q-05 | 权重调节后"点击应用1-2秒刷新"的交互，是否需要loading动画？还是静默刷新？ | P0-11 权重调节 | 设计 | 低 |
| Q-06 | 垫档历史命中率≥90%的硬约束，若某省份某年份垫档候选均不满足90%怎么办？是否允许放宽至85%？ | P0-13 垫档保障 | 产品+数据 | 高（影响信任底线） |
| Q-07 | 新增专业四种参照法的权重配比如何确定？是等权平均还是有推荐优先级？ | P0-10 新增专业 | 数据 | 中 |
| Q-08 | 用户跨年使用（如高三上学期提前规划），系统是否支持"模拟分数"输入而非真实高考分数？ | 非MVP范围 | 产品 | 低（可放入停车场） |

---

## 附录A：数据模型引用

以下6张核心数据表由数据分析师（数析）定义，推荐引擎直接依赖：

1. **score_line**（分数线表）：province_code, year, batch_type, subject_category, school_code, major_group_code, major_code, min_score, min_rank, avg_score, plan_count, actual_count
2. **score_rank**（一分一段表）：province_code, year, subject_category, score, count_at_score, cumulative_count
3. **admission_plan**（招生计划表）：province_code, year, batch_type, school_code, major_group_code, major_code, subject_requirement, plan_count, tuition, is_new_major
4. **school_info**（院校信息表）：school_code, school_name, school_level, school_type, nature, is_985, is_211, is_double_first, province, city
5. **major_info**（专业信息表）：major_code, major_name, major_category, major_subcategory, degree_type, study_duration, is_new, description, employment_direction
6. **subject_requirement**（选科要求表）：province_code, year, school_code, major_code, major_group_code, first_subject, required_subjects, optional_subjects, requirement_type

## 附录B：命名规范备忘

| 场景 | 正确用法 | 禁止用法 |
|------|---------|---------|
| 推荐概率呈现 | 历史命中率 XX-XX% | 录取概率 XX%、录取几率 XX% |
| 推荐档位 | 冲、稳、保、垫 | 冲刺、稳妥、保底、兜底（口语化但不统一） |
| 位次 | 省位次/省排名 | 省排名名次、分数排名 |
| 志愿单位 | 专业+院校 / 院校专业组 | 院校+专业 / 专业组 |
| 新增专业标识 | 新增专业·无历史数据 | 新专业、首招专业 |

---

*文档结束。本文档由析客（Specky）撰写，基于数析（数据分析师）、瑞思（用户研究员）的研究输入及团队协同共识。待方向明（产品总监）审核。*
