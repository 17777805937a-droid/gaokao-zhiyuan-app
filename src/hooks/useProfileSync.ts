/**
 * 志愿档案云端自动同步 Hook
 * 登录后订阅表单 Store 变化，防抖（1.5s）写入服务端。
 * 注水期间（hydrating）不回写，避免回声。
 */

import { useEffect, useRef } from 'react';
import { useFormStore } from '@/store/formStore';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/data/auth';
import { pickFormFields } from '@/utils/profile';

export function useProfileSync(): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsub = useFormStore.subscribe((state) => {
      // 注水期间忽略，避免把刚拉取的数据又写回去
      if (useAuthStore.getState().hydrating) return;

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        authApi
          .saveProfile({
            profileData: pickFormFields(state as never),
            currentStep: state.currentStep,
            hasDraft: state.hasDraft,
          })
          .catch(() => {
            /* 静默失败，下次改动继续重试 */
          });
      }, 1500);
    });

    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [isAuthenticated]);
}
