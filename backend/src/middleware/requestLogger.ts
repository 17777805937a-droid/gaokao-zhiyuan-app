/**
 * HTTP 请求日志中间件
 * 记录每个请求的方法、路径、状态码与耗时，便于排查接口问题。
 */

import type { Request, Response, NextFunction } from 'express';
import { createLogger } from '@/utils/logger.js';

const log = createLogger('HTTP');

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    log[level](`${method} ${originalUrl}`, {
      status,
      durationMs,
      ip: req.ip,
    });
  });

  next();
}
