/**
 * Express 应用配置
 * 中间件注册 + 路由挂载 + 错误处理
 */

import express from 'express';
import cors from 'cors';
import type { CorsOptions } from 'cors';
import { CORS_ORIGIN, API_PREFIX } from '@/config/env.js';
import { responseMiddleware } from '@/middleware/response.js';
import { errorMiddleware } from '@/middleware/error.js';
import { notFoundMiddleware } from '@/middleware/notFound.js';
import { requestLogger } from '@/middleware/requestLogger.js';
import apiRoutes from '@/routes/index.js';

/**
 * 创建并配置 Express 应用
 */
export function createApp(): express.Application {
  const app = express();

  // —— 基础中间件 ——
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS 配置
  const corsOptions: CorsOptions = {
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
  app.use(cors(corsOptions));

  // 统一响应方法
  app.use(responseMiddleware);

  // —— 请求日志（实时控制台 + 写盘） ——
  app.use(requestLogger);

  // —— 健康检查 ——
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // —— API 路由 ——
  app.use(API_PREFIX, apiRoutes);

  // —— 404 处理 ——
  app.use(notFoundMiddleware);

  // —— 全局错误处理 ——
  app.use(errorMiddleware);

  return app;
}
