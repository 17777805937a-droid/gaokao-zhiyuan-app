/**
 * 登录 / 注册页
 * 注册流程：邮箱 + 密码 → 获取邮箱验证码 → 验证码注册并自动登录。
 * 登录流程：邮箱 + 密码直接登录。
 */

import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BottomCTA } from '@/components/common/BottomCTA';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/data/auth';

type Mode = 'login' | 'register';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const startCountdown = () => {
    setCountdown(60);
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(t);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    setError('');
    if (!EMAIL_RE.test(email)) {
      setError('请输入有效邮箱');
      return;
    }
    try {
      const r = await authApi.sendCode(email, 'register');
      setDevCode(r.devCode);
      startCountdown();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!EMAIL_RE.test(email)) {
      setError('请输入有效邮箱');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!code) {
          setError('请输入邮箱验证码');
          setLoading(false);
          return;
        }
        await register(email, password, code);
      }
      navigate('/', { replace: true });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      bottomCTA={
        <BottomCTA
          primaryText={loading ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
          gradient
          onPrimaryClick={handleSubmit}
          primaryDisabled={loading}
        />
      }
    >
      <div className="px-5 pt-10 pb-6">
        <div className="text-3xl mb-2">🔐</div>
        <h1 className="text-2xl font-bold text-text-1">欢迎使用</h1>
        <p className="text-sm text-text-2 mt-1">
          登录后志愿档案自动云端保存，换设备也不丢
        </p>
      </div>

      {/* 登录 / 注册切换 */}
      <div className="px-5">
        <div className="flex bg-surface rounded-full p-1 border border-divider">
          <button
            onClick={() => {
              setMode('login');
              setError('');
              setDevCode(null);
            }}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === 'login' ? 'gradient-primary text-white' : 'text-text-2'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
              setDevCode(null);
            }}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              mode === 'register' ? 'gradient-primary text-white' : 'text-text-2'
            }`}
          >
            注册
          </button>
        </div>
      </div>

      <div className="px-5 mt-5 space-y-3">
        {error && (
          <div className="rounded-xl p-3 bg-red-light border border-red text-sm text-red">
            {error}
          </div>
        )}

        <Field label="邮箱">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm border border-divider text-text-1"
          />
        </Field>

        <Field label="密码">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少 6 位"
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm border border-divider text-text-1"
          />
        </Field>

        {mode === 'register' && (
          <Field label="邮箱验证码">
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6 位验证码"
                className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm border border-divider text-text-1"
              />
              <button
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="shrink-0 px-4 rounded-xl text-sm font-medium border border-divider text-blue disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
              </button>
            </div>
          </Field>
        )}

        {devCode && mode === 'register' && (
          <div className="rounded-xl p-3 bg-gold-light border border-gold text-xs text-text-1 leading-relaxed">
            开发模式：邮件服务未配置，本次验证码为 <b className="text-gold-dark">{devCode}</b>
            （正式环境将通过 QQ 邮箱发送）
          </div>
        )}

        {mode === 'login' && (
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className="text-xs text-text-2 underline"
          >
            还没有账号？去注册
          </button>
        )}
        {mode === 'register' && (
          <button
            onClick={() => {
              setMode('login');
              setError('');
              setDevCode(null);
            }}
            className="text-xs text-text-2 underline"
          >
            已有账号？去登录
          </button>
        )}
      </div>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-text-2 mb-1.5">{label}</div>
      {children}
    </div>
  );
}
