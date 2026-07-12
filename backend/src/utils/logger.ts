/**
 * 统一日志系统
 * ------------------------------------------------------------------
 * 设计目标（用户需求）：
 *   1. 实时输出控制台 —— 每条日志带颜色、时间戳、级别、scope，立即可见
 *   2. 定时写盘       —— 日志先入内存缓冲，按 LOG_FLUSH_INTERVAL_MS 周期批量落盘
 *   3. 便于排查       —— 按天滚动文件 logs/app-YYYY-MM-DD.log；ERROR 立即写盘；
 *                       进程退出/崩溃时同步落盘，避免丢失
 *
 * 写盘采用「同步 append」以保证简单与可靠（MVP 量级日志量极小，无性能压力）。
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  LOG_DIR,
  LOG_LEVEL,
  LOG_TO_FILE,
  LOG_CONSOLE,
  LOG_FLUSH_INTERVAL_MS,
} from '@/config/env.js';

/** 日志级别 */
type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const LEVEL_ORDER: Record<Level, number> = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40,
};

/** ANSI 终端颜色 */
const COLORS: Record<Level, string> = {
  DEBUG: '\x1b[90m', // 灰
  INFO: '\x1b[36m', // 青
  WARN: '\x1b[33m', // 黄
  ERROR: '\x1b[31m', // 红
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

/** 单条日志内存结构 */
interface LogEntry {
  ts: Date;
  level: Level;
  scope: string;
  message: string;
  meta?: unknown;
}

/**
 * 日志器
 */
class Logger {
  private buffer: string[] = []; // 待写盘文本
  private timer: NodeJS.Timeout | null = null;
  private currentDate: string; // 当前日志归属日期 YYYY-MM-DD
  private readonly logDir: string;
  private toFile: boolean;
  private readonly toConsole: boolean;
  private readonly minLevel: Level;
  private readonly flushIntervalMs: number;

  constructor() {
    this.logDir = path.resolve(process.cwd(), LOG_DIR);
    this.toFile = LOG_TO_FILE === 'true';
    this.toConsole = LOG_CONSOLE !== 'false';
    this.minLevel =
      LOG_LEVEL.toUpperCase() in LEVEL_ORDER
        ? (LOG_LEVEL.toUpperCase() as Level)
        : 'INFO';
    const parsed = Number.parseInt(LOG_FLUSH_INTERVAL_MS, 10);
    this.flushIntervalMs = Number.isFinite(parsed) ? Math.max(500, parsed) : 3000;
    this.currentDate = this.dateStr();

    if (this.toFile) {
      this.ensureDir();
      this.startTimer();
      this.installExitHandlers();
    }
  }

  /** 当前日期字符串 YYYY-MM-DD */
  private dateStr(d: Date = new Date()): string {
    return d.toISOString().slice(0, 10);
  }

  /** 确保日志目录存在 */
  private ensureDir(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (e) {
      // 目录创建失败则降级为仅控制台，绝不阻塞主流程
      this.toFile = false;
      if (this.toConsole) {
        // eslint-disable-next-line no-console
        console.error('[Logger] 无法创建日志目录，已禁用写盘:', (e as Error).message);
      }
    }
  }

  /** 当前日志文件路径（按天滚动） */
  private logFilePath(): string {
    return path.join(this.logDir, `app-${this.currentDate}.log`);
  }

  /** 启动定时写盘定时器（不阻止进程退出） */
  private startTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
    if (typeof this.timer.unref === 'function') {
      this.timer.unref(); // 不阻止 node 进程自然退出
    }
  }

  /** 控制台单行格式 */
  private formatConsole(entry: LogEntry): string {
    const time = entry.ts.toISOString().slice(11, 23); // HH:mm:ss.mmm
    const color = COLORS[entry.level];
    const scopePart = entry.scope ? ` ${DIM}[${entry.scope}]${RESET}` : '';
    const metaStr = this.serializeMeta(entry.meta);
    return (
      `${DIM}${time}${RESET} ${color}${BOLD}${entry.level.padEnd(5)}${RESET}` +
      `${scopePart} ${entry.message}${metaStr}`
    );
  }

  /** 文件单行格式（纯文本，便于 grep / 回溯） */
  private formatFile(entry: LogEntry): string {
    const time = entry.ts.toISOString();
    const scopePart = entry.scope ? `[${entry.scope}] ` : '';
    const metaStr = this.serializeMeta(entry.meta);
    return `${time} ${entry.level.padEnd(5)} ${scopePart}${entry.message}${metaStr}`;
  }

  /** 序列化附加信息 */
  private serializeMeta(meta: unknown): string {
    if (meta === undefined) return '';
    if (typeof meta === 'string') return ` ${meta}`;
    try {
      return ` ${JSON.stringify(meta)}`;
    } catch {
      return ' [meta 不可序列化]';
    }
  }

  /** 统一发射 */
  private emit(level: Level, scope: string, message: unknown, meta?: unknown): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[this.minLevel]) return;

    const entry: LogEntry = {
      ts: new Date(),
      level,
      scope,
      message: typeof message === 'string' ? message : serialize(message),
      meta,
    };

    // 1) 实时控制台
    if (this.toConsole) {
      const line = this.formatConsole(entry);
      if (level === 'ERROR') {
        // eslint-disable-next-line no-console
        console.error(line);
      } else if (level === 'WARN') {
        // eslint-disable-next-line no-console
        console.warn(line);
      } else {
        // eslint-disable-next-line no-console
        console.log(line);
      }
    }

    // 2) 入缓冲，定时写盘；ERROR 立即落盘
    if (this.toFile) {
      this.buffer.push(this.formatFile(entry));
      if (level === 'ERROR') {
        this.flush();
      }
    }
  }

  /** 将缓冲批量写入磁盘（同步，保证可靠） */
  flush(): void {
    if (!this.toFile || this.buffer.length === 0) return;
    // 跨天滚动：以最新日期为准
    this.currentDate = this.dateStr();
    const data = this.buffer.join('\n') + '\n';
    this.buffer = [];
    try {
      fs.appendFileSync(this.logFilePath(), data, 'utf8');
    } catch (e) {
      if (this.toConsole) {
        // eslint-disable-next-line no-console
        console.error('[Logger] 写盘失败:', (e as Error).message);
      }
    }
  }

  debug(scope: string, message: unknown, meta?: unknown): void {
    this.emit('DEBUG', scope, message, meta);
  }
  info(scope: string, message: unknown, meta?: unknown): void {
    this.emit('INFO', scope, message, meta);
  }
  warn(scope: string, message: unknown, meta?: unknown): void {
    this.emit('WARN', scope, message, meta);
  }
  error(scope: string, message: unknown, meta?: unknown): void {
    this.emit('ERROR', scope, message, meta);
  }

  /** 注册进程退出/崩溃处理器，保证最后日志落盘 */
  private installExitHandlers(): void {
    // 正常退出前同步落盘（'exit' 事件内仅允许同步 IO）
    process.on('exit', () => {
      this.flush();
    });

    // 未捕获异常：记录后退出
    process.on('uncaughtException', (err: Error) => {
      this.error('System', '未捕获异常 (uncaughtException)', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
      this.flush();
      process.exit(1);
    });

    // 未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason: unknown) => {
      this.error('System', '未处理的 Promise 拒绝 (unhandledRejection)', {
        reason: serialize(reason),
      });
      this.flush();
      process.exit(1);
    });
  }
}

/** 安全序列化任意值为字符串 */
function serialize(v: unknown): string {
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** 单例 */
export const logger = new Logger();

/** 便捷 scope 工厂：createLogger('Server').info(...) */
export function createLogger(scope: string) {
  return {
    debug: (message: unknown, meta?: unknown) => logger.debug(scope, message, meta),
    info: (message: unknown, meta?: unknown) => logger.info(scope, message, meta),
    warn: (message: unknown, meta?: unknown) => logger.warn(scope, message, meta),
    error: (message: unknown, meta?: unknown) => logger.error(scope, message, meta),
  };
}

export type ScopedLogger = ReturnType<typeof createLogger>;
export default logger;
