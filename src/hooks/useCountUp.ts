/**
 * 数字滚动动画 Hook（基于 framer-motion 的 animate）
 * 从 0 平滑增长到目标值，常用于命中率、计数等数字的动态展示。
 */

import { useEffect, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

/**
 * @param target   目标数值
 * @param duration 动画时长（秒）
 * @param decimals 保留小数位
 * @returns 当前动画中的数值
 */
export function useCountUp(target: number, duration = 0.9, decimals = 0): number {
  const [value, setValue] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [target, duration, reduce]);

  return Number(value.toFixed(decimals));
}
