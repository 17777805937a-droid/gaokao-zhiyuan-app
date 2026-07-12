/**
 * 应用布局壳
 * max-w-[393px] 居中 + 安全区域适配
 */

import React from 'react';
import { ProgressBar } from '@/components/common/ProgressBar';
import { PageTransition } from '@/components/common/PageTransition';

interface AppLayoutProps {
  children: React.ReactNode;
  showProgressBar?: boolean;
  step?: number;
  total?: number;
  stepLabel?: string;
  bottomCTA?: React.ReactNode;
}

export function AppLayout({
  children,
  showProgressBar = false,
  step = 1,
  total = 4,
  stepLabel,
  bottomCTA,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[var(--color-bg)] flex justify-center">
      <div className="relative w-full max-w-[393px] min-h-screen bg-[var(--color-bg)] flex flex-col">
        {showProgressBar && (
          <ProgressBar step={step} total={total} label={stepLabel} />
        )}
        <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <PageTransition>{children}</PageTransition>
        </div>
        {bottomCTA && (
          <div className="sticky bottom-0 left-0 right-0 z-20">
            {bottomCTA}
          </div>
        )}
      </div>
    </div>
  );
}
