/**
 * 统一响应中间件
 * 为 res 对象扩展 success() 和 fail() 方法
 */

import type { Response } from 'express';
import type { ApiResponse, ErrorCode } from '@/types/index.js';

/**
 * 扩展 Express Response 类型，增加 success / fail 方法
 */
declare module 'express-serve-static-core' {
  interface Response {
    success<T>(data: T, message?: string): Response;
    fail(code: ErrorCode, message: string): Response;
  }
}

/**
 * 注册统一响应方法到 Express Response 原型
 * 成功：{ code: 0, message: 'ok', data: T }
 * 失败：{ code: ErrorCode, message: string, data: null }
 */
export function responseMiddleware(req: unknown, res: Response, next: () => void): void {
  res.success = function <T>(data: T, message: string = 'ok'): Response {
    const body: ApiResponse<T> = { code: 0, message, data };
    return this.json(body);
  };

  res.fail = function (code: ErrorCode, message: string): Response {
    const body: ApiResponse<null> = { code, message, data: null };
    return this.json(body);
  };

  next();
}
