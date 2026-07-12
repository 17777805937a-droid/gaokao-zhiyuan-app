/**
 * 认证模块类型定义
 */

/** 返回给前端的用户简要信息 */
export interface AuthUserDTO {
  id: number;
  email: string;
  emailVerified: boolean;
}

/** 登录 / 注册成功返回 */
export interface AuthResultDTO {
  token: string;
  user: AuthUserDTO;
}

/** 用户志愿档案（JSONB 表单数据 + 进度） */
export interface UserProfileDTO {
  profileData: Record<string, unknown>;
  currentStep: number;
  hasDraft: boolean;
}
