/**
 * 根组件 — 路由配置
 * 7个页面 + 登录页 + 路由守卫
 */

import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import Step1BasicInfo from '@/pages/Step1BasicInfo';
import Step2Subjects from '@/pages/Step2Subjects';
import Step3Preferences from '@/pages/Step3Preferences';
import Step4Confirm from '@/pages/Step4Confirm';
import ResultsPage from '@/pages/ResultsPage';
import DetailPage from '@/pages/DetailPage';
import LoginPage from '@/pages/LoginPage';
import { useAuthStore } from '@/store/authStore';
import { useProfileSync } from '@/hooks/useProfileSync';

/**
 * 认证引导：挂载档案自动同步；
 * 已登录（token 持久化恢复）且本会话未拉取档案时，从服务端拉取并注水。
 */
function AuthBootstrap() {
  useProfileSync();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrating = useAuthStore((s) => s.hydrating);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (isAuthenticated && !hydrated && !hydrating) {
      hydrate();
    }
  }, [isAuthenticated, hydrated, hydrating, hydrate]);

  return null;
}

const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'wizard',
        children: [
          { path: 'step1', element: <Step1BasicInfo /> },
          { path: 'step2', element: <Step2Subjects /> },
          { path: 'step3', element: <Step3Preferences /> },
          { path: 'step4', element: <Step4Confirm /> },
        ],
      },
      { path: 'results', element: <ResultsPage /> },
      { path: 'results/detail/:id', element: <DetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <RouterProvider router={router} />
    </>
  );
}
