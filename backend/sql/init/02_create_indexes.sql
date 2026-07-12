-- ============================================================
-- 高考志愿填报APP - 索引脚本
-- ============================================================

-- 位次反查：按省份+类别+分数查询
CREATE INDEX IF NOT EXISTS idx_score_rank_lookup
    ON score_rank (province_code, category, score, year);

-- 院校名称模糊查询
CREATE INDEX IF NOT EXISTS idx_school_info_name
    ON school_info (name);

-- 录取分数线：按省份+院校+年份查询
CREATE INDEX IF NOT EXISTS idx_score_line_school
    ON score_line (province_code, school_code, year);

-- 招生计划：按省份+年份+院校查询
CREATE INDEX IF NOT EXISTS idx_admission_plan_lookup
    ON admission_plan (province_code, year, school_code);

-- 推荐结果：按省份+位次查询
CREATE INDEX IF NOT EXISTS idx_rec_result_lookup
    ON recommendation_result (province_code, user_rank);
