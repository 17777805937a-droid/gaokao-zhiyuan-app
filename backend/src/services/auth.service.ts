/**
 * 认证服务（注册 / 登录 / 验证码 / 档案读写）
 */

import { pool } from '@/db/pool.js';
import { BusinessException, ErrorCode } from '@/types/index.js';
import type { AuthResultDTO, AuthUserDTO, UserProfileDTO } from '@/types/auth.js';
import { hashPassword, verifyPassword, signToken, generateCode } from '@/utils/auth.js';
import { sendVerificationEmail } from '@/services/mail.service.js';
import { CODE_TTL_SECONDS } from '@/config/env.js';

/** 发送验证码结果（透传邮件服务结果） */
export interface SendCodeOutcome {
  sent: boolean;
  devCode?: string;
}

type Purpose = 'register' | 'login' | 'reset';

/** 发送邮箱验证码 */
export async function sendCode(email: string, purpose: Purpose): Promise<SendCodeOutcome> {
  const exists = await findUserByEmail(email);
  if (purpose === 'register' && exists) {
    throw new BusinessException(ErrorCode.USER_EXISTS, '该邮箱已注册，请直接登录');
  }
  if (purpose === 'login' && !exists) {
    throw new BusinessException(ErrorCode.USER_NOT_FOUND, '该邮箱尚未注册');
  }

  // 频率限制：60 秒内重复发送
  const recent = await pool.query(
    `SELECT created_at FROM email_codes WHERE email=$1 AND purpose=$2 ORDER BY created_at DESC LIMIT 1`,
    [email, purpose],
  );
  if (recent.rows.length > 0) {
    const diff = Date.now() - new Date(recent.rows[0].created_at).getTime();
    if (diff < 60_000) {
      throw new BusinessException(ErrorCode.FREQUENT, '验证码发送过于频繁，请 60 秒后再试');
    }
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_SECONDS * 1000);

  // 覆盖式写入：删除该邮箱同用途旧码，插入新码
  await pool.query(`DELETE FROM email_codes WHERE email=$1 AND purpose=$2`, [email, purpose]);
  await pool.query(
    `INSERT INTO email_codes (email, code, purpose, expires_at) VALUES ($1,$2,$3,$4)`,
    [email, code, purpose, expiresAt],
  );

  const res = await sendVerificationEmail(email, code, purpose);
  return { sent: res.sent, devCode: res.devCode };
}

/** 注册（邮箱验证码校验通过后创建已验证用户） */
export async function register(
  email: string,
  password: string,
  code: string,
): Promise<AuthResultDTO> {
  await verifyCodeOrThrow(email, 'register', code);

  // 校验通过删除验证码
  await pool.query(`DELETE FROM email_codes WHERE email=$1 AND purpose='register'`, [email]);

  if (await findUserByEmail(email)) {
    throw new BusinessException(ErrorCode.USER_EXISTS, '该邮箱已注册');
  }

  const passwordHash = await hashPassword(password);
  const ins = await pool.query(
    `INSERT INTO users (email, password_hash, email_verified)
     VALUES ($1,$2,true)
     RETURNING id, email, email_verified`,
    [email, passwordHash],
  );
  const row = ins.rows[0];

  // 初始化空档案
  await pool.query(
    `INSERT INTO user_profiles (user_id, profile_data, current_step, has_draft)
     VALUES ($1, '{}'::jsonb, 1, false)`,
    [row.id],
  );

  const user: AuthUserDTO = { id: row.id, email: row.email, emailVerified: row.email_verified };
  const token = signToken({ userId: row.id, email: row.email });
  return { token, user };
}

/** 登录 */
export async function login(email: string, password: string): Promise<AuthResultDTO> {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new BusinessException(ErrorCode.USER_NOT_FOUND, '该邮箱尚未注册');
  }
  if (!user.email_verified) {
    throw new BusinessException(ErrorCode.EMAIL_NOT_VERIFIED, '邮箱尚未验证，请先完成注册验证');
  }
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    throw new BusinessException(ErrorCode.PASSWORD_WRONG, '密码错误');
  }
  const token = signToken({ userId: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, emailVerified: user.email_verified } };
}

/** 读取用户档案（含用户信息与志愿表单） */
export async function getProfile(
  userId: number,
): Promise<{ user: AuthUserDTO; profile: UserProfileDTO }> {
  const u = await pool.query(`SELECT id, email, email_verified FROM users WHERE id=$1`, [userId]);
  if (u.rows.length === 0) {
    throw new BusinessException(ErrorCode.USER_NOT_FOUND, '用户不存在');
  }
  const p = await pool.query(
    `SELECT profile_data, current_step, has_draft FROM user_profiles WHERE user_id=$1`,
    [userId],
  );

  const row = u.rows[0];
  const prof = p.rows[0];
  const user: AuthUserDTO = { id: row.id, email: row.email, emailVerified: row.email_verified };
  const profile: UserProfileDTO = prof
    ? {
        profileData: (prof.profile_data ?? {}) as Record<string, unknown>,
        currentStep: prof.current_step,
        hasDraft: prof.has_draft,
      }
    : { profileData: {}, currentStep: 1, hasDraft: false };

  return { user, profile };
}

/** 保存（写入）用户志愿档案（upsert） */
export async function saveProfile(
  userId: number,
  profileData: Record<string, unknown>,
  currentStep: number,
  hasDraft: boolean,
): Promise<void> {
  await pool.query(
    `INSERT INTO user_profiles (user_id, profile_data, current_step, has_draft, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       profile_data = EXCLUDED.profile_data,
       current_step = EXCLUDED.current_step,
       has_draft   = EXCLUDED.has_draft,
       updated_at = NOW()`,
    [userId, profileData, currentStep, hasDraft],
  );
}

// ===================== 内部辅助 =====================

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  email_verified: boolean;
}

async function findUserByEmail(email: string): Promise<UserRow | null> {
  const r = await pool.query(
    `SELECT id, email, password_hash, email_verified FROM users WHERE email=$1`,
    [email],
  );
  return (r.rows[0] as UserRow) ?? null;
}

/** 校验验证码，错误/过期/缺失均抛异常 */
async function verifyCodeOrThrow(email: string, purpose: string, code: string): Promise<void> {
  const r = await pool.query(
    `SELECT code, expires_at FROM email_codes
     WHERE email=$1 AND purpose=$2 ORDER BY created_at DESC LIMIT 1`,
    [email, purpose],
  );
  if (r.rows.length === 0) {
    throw new BusinessException(ErrorCode.CODE_INVALID, '请先获取验证码');
  }
  const row = r.rows[0];
  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new BusinessException(ErrorCode.CODE_EXPIRED, '验证码已过期，请重新获取');
  }
  if (row.code !== code) {
    throw new BusinessException(ErrorCode.CODE_INVALID, '验证码错误');
  }
}
