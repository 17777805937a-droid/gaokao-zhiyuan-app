-- ============================================================
-- 高考志愿填报APP - 建表脚本
-- 7 张核心表，对齐架构设计文档
-- ============================================================

-- 1. 一分一段表（位次反查核心表）
CREATE TABLE IF NOT EXISTS score_rank (
    id BIGSERIAL PRIMARY KEY,
    province_code VARCHAR(4) NOT NULL,
    year SMALLINT NOT NULL DEFAULT 2024,
    category VARCHAR(16) NOT NULL,
    score SMALLINT NOT NULL,
    cumulative_count INTEGER NOT NULL,
    count_at_score INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 院校主数据
CREATE TABLE IF NOT EXISTS school_info (
    id BIGSERIAL PRIMARY KEY,
    school_code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    province_code VARCHAR(4) NOT NULL,
    city VARCHAR(32) NOT NULL,
    level VARCHAR(16) NOT NULL,
    nature VARCHAR(16) NOT NULL,
    tags TEXT[],
    intro TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 专业主数据
CREATE TABLE IF NOT EXISTS major_info (
    id BIGSERIAL PRIMARY KEY,
    major_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    category VARCHAR(16) NOT NULL,
    degree VARCHAR(16) NOT NULL,
    duration VARCHAR(8) NOT NULL DEFAULT '四年',
    intro TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 历年录取分数线
CREATE TABLE IF NOT EXISTS score_line (
    id BIGSERIAL PRIMARY KEY,
    province_code VARCHAR(4) NOT NULL,
    year SMALLINT NOT NULL,
    school_code VARCHAR(16) NOT NULL,
    major_code VARCHAR(32),
    category VARCHAR(16) NOT NULL,
    batch VARCHAR(16) NOT NULL DEFAULT '本科批',
    min_score SMALLINT,
    min_rank INTEGER,
    avg_score SMALLINT,
    plan_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 招生计划
CREATE TABLE IF NOT EXISTS admission_plan (
    id BIGSERIAL PRIMARY KEY,
    province_code VARCHAR(4) NOT NULL,
    year SMALLINT NOT NULL DEFAULT 2024,
    school_code VARCHAR(16) NOT NULL,
    major_code VARCHAR(32) NOT NULL,
    category VARCHAR(16) NOT NULL,
    batch VARCHAR(16) NOT NULL DEFAULT '本科批',
    plan_count INTEGER NOT NULL,
    duration VARCHAR(8),
    tuition INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 选科要求
CREATE TABLE IF NOT EXISTS subject_requirement (
    id BIGSERIAL PRIMARY KEY,
    province_code VARCHAR(4) NOT NULL,
    year SMALLINT NOT NULL DEFAULT 2024,
    school_code VARCHAR(16) NOT NULL,
    major_code VARCHAR(32) NOT NULL,
    required_subjects TEXT[],
    requirement_desc VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. 推荐结果落库
CREATE TABLE IF NOT EXISTS recommendation_result (
    id BIGSERIAL PRIMARY KEY,
    recommendation_id VARCHAR(32) NOT NULL,
    province_code VARCHAR(4) NOT NULL,
    user_rank INTEGER NOT NULL,
    tier VARCHAR(16) NOT NULL,
    school_code VARCHAR(16) NOT NULL,
    major_code VARCHAR(32) NOT NULL,
    school_name VARCHAR(64) NOT NULL,
    major_name VARCHAR(64) NOT NULL,
    hit_rate_min INTEGER NOT NULL,
    hit_rate_max INTEGER NOT NULL,
    risks JSONB,
    ai_advice TEXT,
    ai_advantage TEXT,
    ai_suggestion TEXT,
    rank_history_min INTEGER,
    rank_history_max INTEGER,
    conversion_method VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
