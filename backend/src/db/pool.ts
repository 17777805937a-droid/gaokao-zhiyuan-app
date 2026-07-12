/**
 * PostgreSQL 连接池
 *
 * 使用 pg.Pool 管理数据库连接，全应用共享同一实例。
 * 连接失败时打印告警，但不阻塞服务启动（降级到硬编码数据）。
 */

import { Pool } from 'pg';
import { DATABASE_URL } from '@/config/env.js';
import { logger } from '@/utils/logger.js';

/** 全局共享连接池 */
export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/** 连接池异常监听（防止未捕获的 Promise 拒绝） */
pool.on('error', (err: Error) => {
  logger.error('DB', '连接池异常', { message: err.message });
});

/**
 * 测试数据库连接是否可用
 * @returns true=连接正常, false=连接失败
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch {
    return false;
  }
}
