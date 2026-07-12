/**
 * 全局 Toast 容器（基于 sonner 开源组件库）
 * 在 main.tsx 中挂载一次即可全站使用。
 */

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '14px',
          fontFamily: 'inherit',
          fontSize: '13px',
        },
      }}
    />
  );
}
