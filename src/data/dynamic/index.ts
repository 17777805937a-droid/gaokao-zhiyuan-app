/**
 * 动态数据加载层（对接后端 API）
 * ------------------------------------------------------------------
 * 阶段一：通过 fetch 调用后端 /api/v1 接口，后端返回硬编码数据。
 * 业务代码请勿直接 import 任意 .json 文件，统一经本文件取数；
 * Hook 层（useScoreRankLookup）仅保留算法与 React 交互，调用本文件的契约函数。
 */

import type {
  Tier,
  RiskType,
  RiskLevel,
  Recommendation,
  TierRecommendations,
  RecommendationRequest,
} from '@/types/recommendation';
import type { RankLookupResult } from '@/types/form';
import type { ApiResponse } from '@/types/common';
import { lookupScoreRankLocal, generateRecommendationsLocally } from '@/data/dynamic/localEngine';

/** 分数→位次：省份系数表（保留接口定义，数据已迁移至后端） */
export interface ScoreRankMockData {
  provinceFactor: Record<string, number>;
}

/** 院校池单条 */
export interface SchoolPoolItem {
  name: string;
  city: string;
  level: string;
  nature: string;
}

/** 风险信号触发条件（逻辑参数，配合风险模板使用） */
export interface RiskCondition {
  /** 仅在某档触发 */
  tier?: string;
  /** 排除某档 */
  excludeTier?: string;
  /** index % indexMod === indexEquals 时命中 */
  indexMod: number;
  indexEquals: number;
}

/** 风险信号模板 */
export interface RiskTemplate {
  type: RiskType;
  level: RiskLevel;
  message: string;
  suggestion: string;
  condition: RiskCondition;
}

/** 四档命中率区间 */
export interface TierHitRateRanges {
  rush: [number, number];
  stable: [number, number];
  preserve: [number, number];
  cushion: [number, number];
}

/** AI 建议文案模板（含 {school}/{major} 占位符，拼装逻辑在后端） */
export interface AiAdviceTemplates {
  rush: string;
  stable: string;
  preserve: string;
  cushion: string;
}

/** 推荐数据契约（数据已迁移至后端） */
export interface RecommendationsMockData {
  schoolPool: SchoolPoolItem[];
  majorPool: string[];
  tierHitRateRanges: TierHitRateRanges;
  riskTemplates: RiskTemplate[];
  aiAdviceTemplates: AiAdviceTemplates;
}

/** 选科类别映射：前端 'all' → 后端 'comprehensive' */
function mapSubjectCategory(category: string): string {
  if (category === 'all') return 'comprehensive';
  return category;
}

// ============================================================
// 网络请求加固（解决 Railway 免费版冷启动导致的"无响应"）
// ============================================================

/**
 * 前端请求统一兜底超时（毫秒）。
 * Vercel 免费版 rewrite 代理转发上限约 10s，这里设 25s 仅防止连接被永久挂起；
 * 真正的冷启动问题由 getRecommendationsWithRetry 的"唤醒 + 轮询 + 重试"解决。
 */
const CLIENT_TIMEOUT_MS = 25000;

/**
 * 带超时控制的 fetch 包装。超时后 AbortController 中断请求，避免无限转圈。
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = CLIENT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 唤醒后端（通过 Vercel rewrite 访问 Railway /health）。
 * 忽略一切错误——目的是触发 Railway 容器从休眠中启动。
 */
export async function wakeBackend(): Promise<void> {
  try {
    await fetchWithTimeout('/health', { method: 'GET' }, 8000);
  } catch {
    /* 唤醒失败不影响后续重试 */
  }
}

/**
 * 轮询后端直到就绪（处理 Railway 冷启动）。
 * 最多等待 maxMs，每 3s 探测一次 /health。
 * @returns true=后端已就绪，false=超时仍未就绪
 */
export async function waitForBackendReady(maxMs = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetchWithTimeout('/health', { method: 'GET' }, 5000);
      if (res.ok) return true;
    } catch {
      /* 尚未就绪，继续等 */
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return false;
}

/**
 * 带"自动唤醒 + 轮询 + 重试"的推荐生成。
 *
 * 背景：Railway 免费版在 5 分钟无流量后休眠容器。用户填写 Step1-3（纯前端，
 * 不打后端）期间 Railway 已休眠，到 Step4 点生成才唤醒，冷启动 10-30s 超过
 * Vercel 代理上限导致连接挂起。本函数：
 *   1. 首次尝试生成（同时触发 Railway 冷启动）
 *   2. 若失败，唤醒后端并轮询等待其就绪
 *   3. 最多重试 maxAttempts 次，期间通过 onStatus 回调向用户展示状态
 *
 * @param req 用户请求数据
 * @param onStatus 状态回调（用于 UI 展示"正在唤醒..."）
 * @param maxAttempts 最大尝试次数（默认 3）
 */
export async function getRecommendationsWithRetry(
  req: RecommendationRequest,
  onStatus?: (msg: string) => void,
  maxAttempts = 2,
): Promise<TierRecommendations> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await getRecommendations(req);
    } catch (err) {
      if (attempt < maxAttempts) {
        onStatus?.(`后端服务正在唤醒，请稍候…（第 ${attempt} 次重试）`);
        await wakeBackend();
        await waitForBackendReady(12000);
      }
    }
  }
  // 后端仍不可用 → 本地兜底引擎生成，保证一定能出方案（修复"无法生成"）
  onStatus?.('后端暂不可用，已切换本地引擎生成方案');
  return generateRecommendationsLocally(req);
}

/**
 * 分数 → 位次反查（异步，调用后端 API）
 *
 * @param provinceCode 省份编码
 * @param category 选科类别（physics/history/all，内部映射为后端值）
 * @param score 高考总分
 * @returns { cumulativeCount, countAtScore }
 */
/**
 * 安全解析 JSON 响应。
 * 检查 HTTP 状态码、Content-Type、body 非空，
 * 三者任一不满足则抛出明确错误（而非浏览器原生的 SyntaxError/Unexpected end of JSON input）。
 */
async function safeParseJson<T>(res: Response, fallbackMsg: string): Promise<T> {
  const text = await res.text();
  if (!text || text.trim().length === 0) {
    throw new Error(`${fallbackMsg}：后端返回了空响应（可能服务未启动或网络中断）`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    // 截取前 80 字符帮助排查，避免把整个 HTML 页面塞进错误消息
    const preview = text.trim().slice(0, 80);
    throw new Error(
      `${fallbackMsg}：后端返回了非法数据（${preview}${text.length > 80 ? '…' : ''}）。` +
      `请确认后端服务正常运行。`,
    );
  }
}

export async function getScoreRank(
  provinceCode: string,
  category: 'physics' | 'history' | 'all',
  score: number,
): Promise<RankLookupResult> {
  try {
    const subjectCategory = mapSubjectCategory(category);

    const res = await fetchWithTimeout('/api/v1/score-rank/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provinceCode, subjectCategory, score }),
    }, 10000);

    if (!res.ok) {
      throw new Error(`位次查询失败（HTTP ${res.status}）`);
    }

    const json: ApiResponse<RankLookupResult> = await safeParseJson<ApiResponse<RankLookupResult>>(res, '位次查询失败');
    if (json.code !== 0 || !json.data) {
      throw new Error(json.message || '位次反查失败');
    }
    return { ...json.data, source: 'backend' };
  } catch {
    // 后端不可达 / 异常 → 本地兜底，保证位次一定能查到（修复"位次无法自动查询"）
    return { ...lookupScoreRankLocal(provinceCode, category, score), source: 'local' };
  }
}

/**
 * 生成推荐结果（异步，调用后端 API）
 *
 * 将完整用户数据发送给后端，后端整合成提示词交由大模型处理，
 * 大模型返回的数据包装成 TierRecommendations 结构后返回。
 * 客户端在等待响应期间播放 LoadingOverlay 动画。
 *
 * @param req 用户请求数据（含省份、位次、选科、偏好等）
 * @returns 四档推荐结果
 */
export async function getRecommendations(
  req: RecommendationRequest,
): Promise<TierRecommendations> {
  const res = await fetchWithTimeout('/api/v1/recommendations/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  }, 12000);

  if (!res.ok) {
    throw new Error(`推荐生成失败（HTTP ${res.status}）：后端服务可能未启动或网络异常`);
  }

  const json: ApiResponse<TierRecommendations> = await safeParseJson<ApiResponse<TierRecommendations>>(res, '推荐生成失败');
  if (json.code !== 0 || !json.data) {
    throw new Error(json.message || '推荐生成失败');
  }
  return json.data;
}

/** 保留类型导出，避免其他文件引用报错 */
export type { Tier, Recommendation, TierRecommendations, RecommendationRequest };
