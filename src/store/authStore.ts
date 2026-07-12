/**
 * 认证状态管理 — Zustand + persist
 * 持久化 token / user / isAuthenticated 到 localStorage。
 * 登录或注册成功后自动从服务端拉取志愿档案并注水到表单 Store。
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';
import { authApi } from '@/data/auth';
import { hydrateForm } from '@/utils/profile';
import { useFormStore } from '@/store/formStore';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** 本会话是否已从服务端拉取档案 */
  hydrated: boolean;
  /** 正在注水（避免 autosave 回声写回） */
  hydrating: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, code: string) => Promise<void>;
  logout: () => void;
  /** 从服务端拉取档案并注入表单 Store */
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hydrated: false,
      hydrating: false,

      login: async (email, password) => {
        const result = await authApi.login(email, password);
        set({ token: result.token, user: result.user, isAuthenticated: true });
        await get().hydrate();
      },

      register: async (email, password, code) => {
        const result = await authApi.register(email, password, code);
        set({ token: result.token, user: result.user, isAuthenticated: true });
        await get().hydrate();
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          hydrated: false,
          hydrating: false,
        });
        // 退出后清空本地草稿，避免不同账号数据串台
        useFormStore.getState().resetForm();
      },

      hydrate: async () => {
        if (!get().isAuthenticated) return;
        set({ hydrating: true });
        try {
          const { profile } = await authApi.getMe();
          hydrateForm(profile.profileData as Record<string, unknown>);
        } catch {
          // 拉取失败不阻断：本地草稿兜底
        } finally {
          // 延迟关闭 hydrating，避免注水动作触发 autosave 回声
          setTimeout(() => set({ hydrating: false, hydrated: true }), 800);
        }
      },
    }),
    {
      name: 'gaokao-auth',
      partialize: (s) => ({
        token: s.token,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
