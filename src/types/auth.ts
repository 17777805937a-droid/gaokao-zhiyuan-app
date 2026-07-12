/**
 * 认证相关前端类型
 */

/** 用户信息 */
export interface AuthUser {
  id: number;
  email: string;
  emailVerified: boolean;
}

/** 登录/注册返回 */
export interface AuthResult {
  token: string;
  user: AuthUser;
}

/** 用户志愿档案 */
export interface UserProfile {
  profileData: Record<string, unknown>;
  currentStep: number;
  hasDraft: boolean;
}

/** 发送验证码返回（开发模式含 devCode） */
export interface SendCodeResult {
  sent: boolean;
  devCode: string | null;
  message: string;
}
