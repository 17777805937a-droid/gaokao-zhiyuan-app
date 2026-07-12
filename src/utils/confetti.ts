/**
 * 庆祝彩带特效（基于 canvas-confetti 开源库）
 * 用于推荐方案成功生成时的视觉反馈。
 */

import confetti from 'canvas-confetti';

/** 推荐生成成功的庆祝彩带：从底部两角发射 + 中部补射 */
export function fireCelebration(): void {
  const colors = ['#FF7A45', '#FAAD14', '#52C41A', '#1890FF', '#FF6B35'];
  const base = {
    spread: 360,
    startVelocity: 32,
    ticks: 60,
    zIndex: 200,
    colors,
  };

  // 左右两角向上喷射
  confetti({ ...base, particleCount: 90, origin: { x: 0, y: 0.65 } });
  confetti({ ...base, particleCount: 90, origin: { x: 1, y: 0.65 } });

  // 中部补一发，增强层次
  window.setTimeout(() => {
    confetti({
      ...base,
      particleCount: 70,
      spread: 100,
      startVelocity: 28,
      origin: { x: 0.5, y: 0.35 },
    });
  }, 180);
}
