/**
 * 认证控制器
 */

import type { Request, Response, NextFunction } from 'express';
import { sendCode, register, login, getProfile, saveProfile } from '@/services/auth.service.js';
import { validateEmail, validatePassword } from '@/utils/validator.js';

type Purpose = 'register' | 'login' | 'reset';

/** POST /api/v1/auth/send-code —— 发送邮箱验证码 */
export async function sendCodeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = validateEmail(req.body?.email);
    const purpose: Purpose =
      req.body?.purpose === 'login' || req.body?.purpose === 'reset'
        ? req.body.purpose
        : 'register';
    const outcome = await sendCode(email, purpose);
    res.success(
      {
        sent: outcome.sent,
        devCode: outcome.devCode ?? null,
        message: outcome.sent ? '验证码已发送，请查收邮件' : '验证码已生成（开发模式，见服务端控制台）',
      },
      'ok',
    );
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/register —— 邮箱验证码注册 */
export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = validateEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
    const code = String(req.body?.code ?? '').trim();
    const result = await register(email, password, code);
    res.success(result, '注册成功');
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/login —— 登录 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const email = validateEmail(req.body?.email);
    const password = validatePassword(req.body?.password);
    const result = await login(email, password);
    res.success(result, '登录成功');
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/auth/me —— 获取当前用户 + 档案（需登录） */
export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as Request & { userId: number }).userId;
    const data = await getProfile(userId);
    res.success(data);
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/auth/profile —— 保存志愿档案（需登录） */
export async function saveProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as Request & { userId: number }).userId;
    const profileData = (req.body?.profileData ?? {}) as Record<string, unknown>;
    const currentStep = Number(req.body?.currentStep ?? 1);
    const hasDraft = Boolean(req.body?.hasDraft);
    await saveProfile(userId, profileData, currentStep, hasDraft);
    res.success(null, '已保存');
  } catch (err) {
    next(err);
  }
}
