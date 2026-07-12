/**
 * 全局错误处理中间件
 */

import type { Request, Response, NextFunction } from 'express';
import { BusinessException, ErrorCode } from '@/types/index.js';
import type { ApiResponse } from '@/types/index.js';
import { logger } from '@/utils/logger.js';

/**
 * 全局错误处理
 * 捕获 BusinessException 返回对应错误码；
 * 其他未知错误返回 500 + INTERNAL_ERROR
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof BusinessException) {
    const body: ApiResponse<null> = {
      code: err.code,
      message: err.message,
      data: null,
    };
    res.status(200).json(body);
    return;
  }

  // 未知错误
  logger.error('UnhandledError', { message: err.message, stack: err.stack });
  const body: ApiResponse<null> = {
    code: ErrorCode.INTERNAL_ERROR,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    data: null,
  };
  res.status(500).json(body);
}
