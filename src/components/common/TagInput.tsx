/**
 * 标签式多选输入（专业黑名单、城市、院校层次）
 */

import React, { useState } from 'react';
import clsx from 'clsx';

interface TagInputProps {
  label?: string;
  placeholder?: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  variant?: 'default' | 'danger';
  maxTags?: number;
  searchable?: boolean;
  searchOptions?: string[];
}

export function TagInput({
  label,
  placeholder = '+ 搜索添加',
  tags,
  onAdd,
  onRemove,
  variant = 'default',
  maxTags = 10,
  searchable = true,
  searchOptions = [],
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = searchOptions
    .filter((opt) => opt.includes(inputValue) && !tags.includes(opt))
    .slice(0, 15);

  const handleAdd = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onAdd(trimmed);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    }
  };

  const isDanger = variant === 'danger';
  const isMaxReached = tags.length >= maxTags;

  return (
    <div>
      {label && (
        <div className="text-sm font-semibold text-text-1 mb-2">{label}</div>
      )}

      {/* 已选标签 */}
      {tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className={clsx(
                'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium',
                isDanger
                  ? 'bg-red-light text-red'
                  : 'bg-primary-light text-primary-dark',
              )}
            >
              {tag}
              <button
                onClick={() => onRemove(tag)}
                className={clsx(
                  'ml-0.5 opacity-60 active:opacity-100',
                  isDanger ? 'text-red' : 'text-primary',
                )}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 搜索输入 */}
      {searchable && !isMaxReached && (
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={clsx(
              'w-full h-12 border-[1.5px] border-dashed border-border rounded-lg px-3',
              'text-sm text-text-1 bg-surface placeholder:text-text-3',
              'focus:border-primary',
            )}
          />
          {/* 搜索联想 */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-lg shadow-lg border border-border z-10 max-h-72 overflow-y-auto">
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleAdd(suggestion)}
                  className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-primary-light active:bg-primary-light"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isMaxReached && (
        <p className="text-xs text-text-3 text-center">已达最大数量 {maxTags}</p>
      )}
    </div>
  );
}
