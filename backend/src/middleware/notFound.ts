/**
 * 404 处理中间件
 */

import type { Request, Response, NextFunction } from 'express';
import { ErrorCode } from '@/types/index.js';
import type { ApiResponse } from '@/types/index.js';

/**
 * 404 未找到路由
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function notFoundMiddleware(req: Request, res: Response, next: NextFunction): void {
  const body: ApiResponse<null> = {
    code: ErrorCode.NOT_FOUND,
    message: `路由不存在: ${req.method} ${req.originalUrl}`,
    data: null,
  };
  res.status(404).json(body);
}
