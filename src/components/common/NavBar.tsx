/**
 * 通用导航栏（标题 + 返回按钮）
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface NavBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
}

export function NavBar({ title, showBack = false, onBack, rightSlot }: NavBarProps) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="flex items-center justify-between px-5 py-2 h-11">
      {showBack ? (
        <button
          onClick={handleBack}
          className="w-8 h-8 flex items-center justify-center text-text-1 active:opacity-60"
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </button>
      ) : (
        <div className="w-8" />
      )}
      <span className="text-base font-semibold text-text-1">{title}</span>
      <div className="w-8">{rightSlot}</div>
    </div>
  );
}
