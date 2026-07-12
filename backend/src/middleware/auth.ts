/**
 * 鉴权中间件：校验 Authorization: Bearer <token>
 */

import type { Request, Response, NextFunction } from 'express';
import { BusinessException, ErrorCode } from '@/types/index.js';
import { verifyToken } from '@/utils/auth.js';

// 扩展 Express Request，挂载解析出的用户身份
declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
    userEmail?: string;
  }
}

/**
 * 要求登录：从 Bearer Token 解析用户身份，失败抛 AUTH_ERROR
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new BusinessException(ErrorCode.AUTH_ERROR, '请先登录'));
    return;
  }
  const payload = verifyToken(header.slice(7));
  if (!payload) {
    next(new BusinessException(ErrorCode.AUTH_ERROR, '登录已过期，请重新登录'));
    return;
  }
  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}
