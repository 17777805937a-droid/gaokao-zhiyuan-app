-- ============================================================
-- 高考志愿填报APP - 种子数据
-- 对齐阶段一硬编码数据，保证接口结果一致
-- ============================================================

-- ============================================================
-- 1. 院校主数据（8所，对齐 schoolPool）
-- ============================================================
INSERT INTO school_info (school_code, name, province_code, city, level, nature, tags, intro) VALUES
('S001', '山东大学',     '37', '济南', '985',     '公办', ARRAY['985','双一流','综合类'],     '山东大学是国家"双一流"、"985工程"、"211工程"重点建设高校。'),
('S002', '中国海洋大学', '37', '青岛', '985',     '公办', ARRAY['985','双一流','海洋特色'],   '中国海洋大学是一所海洋和水产学科特色显著的教育部直属重点综合性大学。'),
('S003', '山东师范大学', '37', '济南', '省重点',  '公办', ARRAY['省重点','师范类'],           '山东师范大学是山东省重点大学，师范教育特色鲜明。'),
('S004', '青岛大学',     '37', '青岛', '省重点',  '公办', ARRAY['省重点','综合类'],           '青岛大学是山东省重点综合大学。'),
('S005', '济南大学',     '37', '济南', '普通本科','公办', ARRAY['普通本科','综合类'],         '济南大学是山东省属普通本科院校。'),
('S006', '山东科技大学', '37', '青岛', '普通本科','公办', ARRAY['普通本科','理工类'],         '山东科技大学是一所以工科为主的普通本科院校。'),
('S007', '山东理工大学', '37', '淄博', '普通本科','公办', ARRAY['普通本科','理工类'],         '山东理工大学是山东省属普通本科院校。'),
('S008', '烟台大学',     '37', '烟台', '普通本科','公办', ARRAY['普通本科','综合类'],         '烟台大学是山东省属普通本科综合性大学。');

-- ============================================================
-- 2. 专业主数据（10个，对齐 majorPool）
-- ============================================================
INSERT INTO major_info (major_code, name, category, degree, duration, intro) VALUES
('M001', '计算机科学与技术',     '计算机类',     '工学学士', '四年', '计算机科学与技术专业培养计算机软硬件系统设计与开发人才。'),
('M002', '人工智能',             '电子信息类',   '工学学士', '四年', '人工智能专业培养AI算法与应用开发人才。'),
('M003', '数据科学与大数据技术', '计算机类',     '工学学士', '四年', '数据科学与大数据技术专业培养大数据分析与处理人才。'),
('M004', '软件工程',             '计算机类',     '工学学士', '四年', '软件工程专业培养软件系统分析、设计与开发人才。'),
('M005', '电子信息工程',         '电子信息类',   '工学学士', '四年', '电子信息工程专业培养电子设备与信息系统设计人才。'),
('M006', '自动化',               '自动化类',     '工学学士', '四年', '自动化专业培养工业自动化系统设计与控制人才。'),
('M007', '机械工程',             '机械类',       '工学学士', '四年', '机械工程专业培养机械设计制造及其自动化人才。'),
('M008', '金融学',               '金融学类',     '经济学学士','四年','金融学专业培养金融分析与风险管理人才。'),
('M009', '会计学',               '工商管理类',   '管理学学士','四年','会计学专业培养财务会计与审计人才。'),
('M010', '法学',                 '法学类',       '法学学士', '四年', '法学专业培养法律实务与法律研究人才。');

-- ============================================================
-- 3. 一分一段表（3省 × 2类别 × 400-700步长10 = 186行）
--    使用阶段一算法预计算：与 lookupScoreRank 完全一致
-- ============================================================
DO $$
DECLARE
    p_code VARCHAR(4);
    cat    VARCHAR(16);
    sc     SMALLINT;
    base_f FLOAT8;
    f      FLOAT8;
    val    FLOAT8;
    cum_c  INTEGER;
    cnt_v  FLOAT8;
    cnt_c  INTEGER;
BEGIN
    FOREACH p_code IN ARRAY ARRAY['37','13','43'] LOOP
        base_f := CASE p_code
            WHEN '37' THEN 1.2
            WHEN '13' THEN 1.0
            WHEN '43' THEN 0.9
            ELSE 1.0
        END;

        FOREACH cat IN ARRAY ARRAY['physics','history'] LOOP
            f := base_f * (CASE WHEN cat = 'history' THEN 0.4::float8 ELSE 1.0::float8 END);

            FOR sc IN 400..700 BY 10 LOOP
                -- baseRank = round((750 - score) * (80 + score*0.08) * factor)
                -- 使用 float8 运算以与 JavaScript Math.round 行为完全一致
                val := (750.0::float8 - sc::float8) * (80.0::float8 + sc::float8 * 0.08::float8) * f;
                cum_c := GREATEST(ROUND(val::numeric)::integer, 1);

                -- countAtScore = max(round(50 - (750 - score)*0.06), 5)
                cnt_v := 50.0::float8 - (750.0::float8 - sc::float8) * 0.06::float8;
                cnt_c := GREATEST(ROUND(cnt_v::numeric)::integer, 5);

                INSERT INTO score_rank (province_code, year, category, score, cumulative_count, count_at_score)
                VALUES (p_code, 2024, cat, sc, cum_c, cnt_c);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- 4. 历年录取分数线（8院校 × 10专业 × 3年 = 240行）
--    基于院校层次生成合理模拟分数
-- ============================================================
DO $$
DECLARE
    s_code  VARCHAR(16);
    m_code  VARCHAR(32);
    yr      SMALLINT;
    s_idx   INTEGER;
    m_idx   INTEGER;
    base_s  SMALLINT;
    m_adj   SMALLINT;
    yr_adj  SMALLINT;
    min_s   SMALLINT;
    avg_s   SMALLINT;
    min_r   INTEGER;
BEGIN
    FOR s_idx IN 1..8 LOOP
        s_code := 'S' || lpad(s_idx::text, 3, '0');

        -- 院校基础分：985高、省重点中、普通本科低
        base_s := CASE
            WHEN s_idx <= 2 THEN 630   -- 985
            WHEN s_idx <= 4 THEN 580   -- 省重点
            ELSE 530                    -- 普通本科
        END;

        FOR m_idx IN 1..10 LOOP
            m_code := 'M' || lpad(m_idx::text, 3, '0');

            -- 专业调整：计算机/人工智能/数据科学分数更高
            m_adj := CASE
                WHEN m_idx IN (1,2,3) THEN 20
                WHEN m_idx IN (4,5)   THEN 10
                WHEN m_idx = 6         THEN 5
                ELSE 0
            END;

            FOR yr IN 2022..2024 LOOP
                -- 年份调整：逐年小幅上升
                yr_adj := (yr - 2022) * 3;

                min_s := base_s + m_adj + yr_adj + ((s_idx + m_idx) % 7) - 3;
                avg_s := min_s + 5 + (m_idx % 4);
                min_r := GREATEST(100, 50000 - (min_s - 500) * 300);

                INSERT INTO score_line (province_code, year, school_code, major_code, category, batch, min_score, min_rank, avg_score)
                VALUES ('37', yr, s_code, m_code, 'physics', '本科批', min_s, min_r, avg_s);
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- 5. 招生计划（8院校 × 10专业 = 80行）
-- ============================================================
DO $$
DECLARE
    s_code VARCHAR(16);
    m_code VARCHAR(32);
    s_idx  INTEGER;
    m_idx  INTEGER;
    p_cnt  INTEGER;
    tut    INTEGER;
BEGIN
    FOR s_idx IN 1..8 LOOP
        s_code := 'S' || lpad(s_idx::text, 3, '0');
        FOR m_idx IN 1..10 LOOP
            m_code := 'M' || lpad(m_idx::text, 3, '0');
            p_cnt := 30 + ((s_idx * 7 + m_idx * 3) % 90);
            -- 学费：理工科 5000-6000，文法经管 4500-5500
            tut := CASE
                WHEN m_idx IN (1,2,3,4,5,6,7) THEN 5000 + (m_idx % 3) * 1000
                ELSE 4500 + (m_idx % 3) * 500
            END;

            INSERT INTO admission_plan (province_code, year, school_code, major_code, category, batch, plan_count, duration, tuition)
            VALUES ('37', 2024, s_code, m_code, 'physics', '本科批', p_cnt, '四年', tut);
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- 6. 选科要求（8院校 × 10专业 = 80行）
--    理工科要求物理，文法经管不限
-- ============================================================
DO $$
DECLARE
    s_code VARCHAR(16);
    m_code VARCHAR(32);
    s_idx  INTEGER;
    m_idx  INTEGER;
    req_d  VARCHAR(32);
    subs   TEXT[];
BEGIN
    FOR s_idx IN 1..8 LOOP
        s_code := 'S' || lpad(s_idx::text, 3, '0');
        FOR m_idx IN 1..10 LOOP
            m_code := 'M' || lpad(m_idx::text, 3, '0');
            IF m_idx IN (1,2,3,4,5,6,7) THEN
                req_d := '物理必选';
                subs  := ARRAY['物理'];
            ELSE
                req_d := '不限';
                subs  := ARRAY[]::TEXT[];
            END IF;

            INSERT INTO subject_requirement (province_code, year, school_code, major_code, required_subjects, requirement_desc)
            VALUES ('37', 2024, s_code, m_code, subs, req_d);
        END LOOP;
    END LOOP;
END $$;
