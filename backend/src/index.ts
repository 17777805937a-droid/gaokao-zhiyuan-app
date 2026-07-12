/**
 * 服务入口
 * 创建 Express 应用并监听指定端口
 *
 * 启动流程：
 * 1. 初始化推荐缓存（从 DB 加载院校/专业数据）
 * 2. 启动 HTTP 服务
 */

import { createApp } from '@/app.js';
import { PORT } from '@/config/env.js';
import { testConnection } from '@/db/pool.js';
import { initRecommendationCache } from '@/services/recommendation.service.js';
import { logger, createLogger } from '@/utils/logger.js';

const log = createLogger('Server');

async function main(): Promise<void> {
  // —— 检查数据库连接 ——
  const dbOk = await testConnection();
  if (dbOk) {
    log.info('数据库连接正常');
    // —— 加载推荐缓存（院校/专业数据） ——
    await initRecommendationCache();
  } else {
    log.warn('数据库连接失败，使用硬编码数据降级运行');
  }

  // —— 启动 HTTP 服务 ——
  const app = createApp();

  app.listen(PORT, () => {
    log.info('高考志愿填报后端服务已启动');
    log.info(`监听端口: http://localhost:${PORT}`);
    log.info(`健康检查: http://localhost:${PORT}/health`);
    log.info(`API 前缀: http://localhost:${PORT}/api/v1`);
  });
}

main().catch((err) => {
  log.error('启动失败', { message: (err as Error).message, stack: (err as Error).stack });
  process.exit(1);
});
