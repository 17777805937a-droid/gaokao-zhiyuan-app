/**
 * 认证 API 封装（对接 /api/v1/auth）
 * token 从 authStore 读取，统一附带 Authorization 头。
 */

import type { ApiResponse } from '@/types/common';
import type { AuthResult, AuthUser, UserProfile, SendCodeResult } from '@/types/auth';
import { useAuthStore } from '@/store/authStore';

const BASE = '/api/v1/auth';

/** 统一请求：非 0 视为错误，抛出 message */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 0 || json.data == null) {
    throw new Error(json.message || '请求失败');
  }
  return json.data;
}

export const authApi = {
  /** 发送邮箱验证码 */
  sendCode: (email: string, purpose: 'register' | 'login' | 'reset') =>
    request<SendCodeResult>('/send-code', {
      method: 'POST',
      body: JSON.stringify({ email, purpose }),
    }),

  /** 邮箱验证码注册 */
  register: (email: string, password: string, code: string) =>
    request<AuthResult>('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, code }),
    }),

  /** 登录 */
  login: (email: string, password: string) =>
    request<AuthResult>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** 获取当前用户 + 档案 */
  getMe: () => request<{ user: AuthUser; profile: UserProfile }>('/me', { method: 'GET' }),

  /** 保存志愿档案 */
  saveProfile: (payload: {
    profileData: Record<string, unknown>;
    currentStep: number;
    hasDraft: boolean;
  }) =>
    request<null>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
