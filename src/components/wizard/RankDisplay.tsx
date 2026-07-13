/**
 * 位次反查结果展示卡（loading→结果→手动修改）
 * 
 * 关键改动：无论 loading/error/空状态，始终提供手动输入位次的入口
 * 解决后端不可达时用户被卡住无法继续的问题
 */

import { useState } from 'react';
import { formatNumber } from '@/utils/format';
import { RANK_DEVIATION_THRESHOLD } from '@/config/constants';

interface RankDisplayProps {
  loading: boolean;
  rank: number | null;
  rankRange?: [number, number];
  sameScoreCount?: number;
  error?: string;
  userRank: number | null;
  onUserRankChange: (rank: number | null) => void;
  deviationWarning?: boolean;
  source?: 'backend' | 'local';
}

export function RankDisplay({
  loading,
  rank,
  rankRange,
  sameScoreCount,
  error,
  userRank,
  onUserRankChange,
  deviationWarning = false,
  source,
}: RankDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  // 编辑状态（统一渲染）
  if (editing) {
    return (
      <div
        className="rounded-2xl p-3.5 border"
        style={{
          background: 'linear-gradient(135deg, var(--color-green-light) 0%, #F0FFF0 100%)',
          borderColor: 'rgba(82, 196, 26, 0.2)',
        }}
      >
        <div className="text-sm font-semibold text-green-dark mb-2">手动输入位次</div>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value.replace(/\D/g, ''))}
            placeholder="请输入位次（如：3500）"
            className="flex-1 h-10 border-[1.5px] border-border rounded-lg px-3 text-base font-medium text-text-1 bg-surface focus:border-primary outline-none"
            autoFocus
          />
          <button
            onClick={() => {
              const num = parseInt(editValue, 10);
              if (!isNaN(num) && num > 0) {
                onUserRankChange(num);
                setEditing(false);
              }
            }}
            className="px-4 h-10 rounded-lg bg-green text-white text-sm font-medium active:opacity-80"
          >
            确认
          </button>
          <button
            onClick={() => {
              setEditing(false);
              // 取消手动修改时，恢复为自动反查的位次（如果有）
              if (userRank !== null && rank !== null) {
                onUserRankChange(rank);
              }
            }}
            className="px-3 h-10 rounded-lg text-text-2 text-sm border border-border active:opacity-60"
          >
            取消
          </button>
        </div>
        {deviationWarning && (
          <div className="mt-2 text-[11px] text-gold bg-gold-light rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>手动位次与系统反查偏差超过{(RANK_DEVIATION_THRESHOLD * 100).toFixed(0)}%，请确认输入是否正确</span>
          </div>
        )}
      </div>
    );
  }

  // Loading 状态 — 带手动入口
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl p-3.5 bg-blue-light border border-[rgba(24,144,255,0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full border-2 border-blue/30 border-t-blue animate-spin" />
            <span className="text-sm font-semibold text-blue">正在查询省位次...</span>
          </div>
          <p className="text-[11px] text-text-2">基于一分一段表自动匹配</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-[12px] text-blue underline ml-1"
        >
          查询较慢？手动输入位次 →
        </button>
      </div>
    );
  }

  // Error 状态 — 带手动入口
  if (error) {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl p-3.5 bg-red-light border border-[rgba(255,77,79,0.2)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">❌</span>
            <span className="text-sm font-semibold text-red">位次查询失败</span>
          </div>
          <p className="text-[11px] text-text-2">{error}</p>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-[12px] text-blue underline ml-1 font-medium"
        >
          👉 手动输入位次继续填报 →
        </button>
      </div>
    );
  }

  // 无数据 + 非编辑中 → 显示手动输入入口（关键！解决"下一步灰色卡死"问题）
  if (rank === null && userRank === null) {
    return (
      <div className="rounded-2xl p-3.5 border border-dashed border-border bg-surface">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-text-2">未获取到位次信息</span>
            <p className="text-[11px] text-text-3 mt-0.5">可手动输入位次继续填报</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg bg-green text-white text-xs font-medium active:opacity-80"
          >
            手动输入位次
          </button>
        </div>
      </div>
    );
  }

  // 成功状态
  const displayRank = userRank ?? rank;

  return (
    <div
      className="rounded-2xl p-3.5 border"
      style={{
        background: 'linear-gradient(135deg, var(--color-green-light) 0%, #F0FFF0 100%)',
        borderColor: 'rgba(82, 196, 26, 0.2)',
      }}
    >
      <>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base">✅</span>
          <span className="text-sm font-semibold text-green-dark">
            {source === 'local' ? '位次已本地估算' : '省位次已自动查询'}
          </span>
          {source === 'local' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-light text-gold font-medium">
              离线引擎
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-text-2">约第</span>
          <span className="text-2xl font-bold text-green-dark">
            {displayRank ? formatNumber(displayRank) : '--'}
          </span>
          <span className="text-xs text-text-2">名</span>
        </div>
        {rankRange && sameScoreCount !== null && sameScoreCount !== undefined && (
          <div className="text-[11px] text-text-2 mt-1">
            同分{sameScoreCount}人 · 位次区间 {formatNumber(rankRange[0])}–{formatNumber(rankRange[1])}
          </div>
        )}
        <button
          onClick={() => {
            setEditValue(displayRank?.toString() ?? '');
            setEditing(true);
          }}
          className="text-[11px] text-blue underline mt-2"
        >
          手动修改位次
        </button>
      </>
    </div>
  );
}
