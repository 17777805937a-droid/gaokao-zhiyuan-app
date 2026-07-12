/**
 * 全屏加载遮罩（推荐生成 loading 轮播文字）
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOADING_MESSAGES } from '@/config/constants';

interface LoadingOverlayProps {
  visible: boolean;
  messages?: string[];
  interval?: number;
}

export function LoadingOverlay({
  visible,
  messages = LOADING_MESSAGES,
  interval = 1800,
}: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [visible, messages.length, interval]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl p-8 w-[280px] flex flex-col items-center">
        {/* 加载动画 */}
        <div className="relative w-16 h-16 mb-6">
          {/* 呼吸光晕 */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '3px solid var(--color-primary-light)' }}
            animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0.15, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '3px solid var(--color-primary-light)',
              borderTopColor: 'var(--color-primary)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            ⚡
          </div>
        </div>

        {/* 轮播文字 */}
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            className="text-sm text-text-1 text-center font-medium"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>

        {/* 进度点 */}
        <div className="flex gap-1.5 mt-4">
          {messages.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === messageIndex ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
