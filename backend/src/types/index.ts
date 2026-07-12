/**
 * 后端通用类型定义
 */

/** API 响应格式 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

/** 错误码枚举 */
export enum ErrorCode {
  /** 成功 */
  SUCCESS = 0,
  /** 参数错误 */
  PARAM_ERROR = 1001,
  /** 未找到 */
  NOT_FOUND = 1002,
  /** 内部错误 */
  INTERNAL_ERROR = 2001,

  /** 未登录 / 登录已过期 */
  AUTH_ERROR = 3001,
  /** 用户已存在 */
  USER_EXISTS = 3002,
  /** 用户不存在 */
  USER_NOT_FOUND = 3003,
  /** 验证码错误 */
  CODE_INVALID = 3004,
  /** 验证码已过期 */
  CODE_EXPIRED = 3005,
  /** 邮箱未验证 */
  EMAIL_NOT_VERIFIED = 3006,
  /** 密码错误 */
  PASSWORD_WRONG = 3007,
  /** 验证码发送过于频繁 */
  FREQUENT = 3008,
}

/** 业务异常 */
export class BusinessException extends Error {
  public readonly code: ErrorCode;
  public readonly data: null;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
    this.data = null;
  }
}
