/**
 * 环境变量配置
 */

import dotenv from 'dotenv';

dotenv.config();

/** 服务端口 */
export const PORT: number = parseInt(process.env.PORT ?? '8080', 10);

/** CORS 允许来源 */
export const CORS_ORIGIN: string = process.env.CORS_ORIGIN ?? '*';

/** API 版本前缀 */
export const API_PREFIX: string = '/api/v1';

/** PostgreSQL 数据库连接字符串 */
export const DATABASE_URL: string =
  process.env.DATABASE_URL ??
  'postgresql://gaokao:gaokao123@localhost:5432/gaokao_db';

// ===== DeepSeek 大模型配置 =====

/** DeepSeek API Key（从 .env 读取，用户需自行粘贴） */
export const DEEPSEEK_API_KEY: string = process.env.DEEPSEEK_API_KEY ?? '';

/** DeepSeek API 基础地址（OpenAI 兼容接口） */
export const DEEPSEEK_BASE_URL: string =
  process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';

/** 使用的模型名称 */
export const DEEPSEEK_MODEL: string =
  process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash';

/** 大模型请求超时时间（毫秒），默认 5 秒
 * 说明：Vercel 免费版 rewrite 代理转发超时约 10 秒。
 * 若设为 60s，DeepSeek 响应慢时会触发 Vercel 提前掐断连接 → 前端「无响应」。
 * 设为 5s：DeepSeek 5 秒内未响应则立即降级规则引擎（<1s 返回），稳在 10s 限制内，留足余量。
 */
export const LLM_TIMEOUT: number = parseInt(
  process.env.LLM_TIMEOUT ?? '5000',
  10,
);

// ===== SMTP 邮件（国内免费：QQ邮箱 / 163邮箱）=====
/** SMTP 服务器（QQ邮箱默认 smtp.qq.com） */
export const SMTP_HOST: string = process.env.SMTP_HOST ?? 'smtp.qq.com';
/** SMTP 端口（QQ邮箱 SSL 默认 465） */
export const SMTP_PORT: number = parseInt(process.env.SMTP_PORT ?? '465', 10);
/** 是否使用 SSL/TLS（QQ邮箱 465 端口为 true） */
export const SMTP_SECURE: boolean = (process.env.SMTP_SECURE ?? 'true') === 'true';
/** 发件邮箱（即开通了 SMTP 的 QQ/163 邮箱） */
export const SMTP_USER: string = process.env.SMTP_USER ?? '';
/** SMTP 授权码（注意：不是邮箱登录密码，是 16 位授权码） */
export const SMTP_PASS: string = process.env.SMTP_PASS ?? '';
/** 邮件发件人显示名 */
export const MAIL_FROM: string =
  process.env.MAIL_FROM ?? (SMTP_USER ? `高考志愿填报AI助手 <${SMTP_USER}>` : '');

// ===== JWT 认证 =====
/** JWT 签名密钥（生产环境必须替换为强随机值并通过环境变量注入） */
export const JWT_SECRET: string = process.env.JWT_SECRET ?? 'dev-only-secret-change-me';
/** JWT 有效期（默认 7 天） */
export const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '7d';

// ===== 邮箱验证码 =====
/** 验证码有效期（秒），默认 5 分钟 */
export const CODE_TTL_SECONDS: number = parseInt(process.env.CODE_TTL_SECONDS ?? '300', 10);
/** 验证码长度，默认 6 位 */
export const CODE_LENGTH: number = parseInt(process.env.CODE_LENGTH ?? '6', 10);

// ===== 日志系统 =====
/** 日志目录（相对 cwd），默认 logs */
export const LOG_DIR: string = process.env.LOG_DIR ?? 'logs';
/** 控制台最低输出级别：debug/info/warn/error，默认 info */
export const LOG_LEVEL: string = process.env.LOG_LEVEL ?? 'info';
/** 是否写盘，默认 true（设为 false 仅输出控制台） */
export const LOG_TO_FILE: string = process.env.LOG_TO_FILE ?? 'true';
/** 是否输出控制台，默认 true（设为 false 仅写盘） */
export const LOG_CONSOLE: string = process.env.LOG_CONSOLE ?? 'true';
/** 定时写盘间隔（毫秒），默认 3000，最小 500 */
export const LOG_FLUSH_INTERVAL_MS: string = process.env.LOG_FLUSH_INTERVAL_MS ?? '3000';
