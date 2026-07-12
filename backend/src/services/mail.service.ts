/**
 * 邮件服务（nodemailer）
 * 国内免费方案：QQ邮箱 / 163邮箱 SMTP（开启 POP3/SMTP 后使用 16 位授权码登录）
 *
 * 开发模式降级：未配置 SMTP 账号时，不真正发信，
 * 而是把验证码打印到服务端控制台，并随接口返回（devCode），
 * 便于在没有配置邮箱的情况下跑通完整注册/登录流程。
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} from '@/config/env.js';
import { createLogger } from '@/utils/logger.js';

const log = createLogger('Mail');

let transporter: Transporter | null = null;

/** 获取（或惰性创建）SMTP 传输器；未配置则返回 null */
function getTransporter(): Transporter | null {
  if (!SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

/** 发送结果：sent=是否真实发出；devCode=开发模式下的验证码 */
export interface SendCodeResult {
  sent: boolean;
  devCode?: string;
}

const PURPOSE_TEXT: Record<string, string> = {
  register: '注册',
  login: '登录',
  reset: '重置密码',
};

/**
 * 发送验证码邮件
 * @param to 收件邮箱
 * @param code 验证码
 * @param purpose 用途（register/login/reset）
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  purpose: string,
): Promise<SendCodeResult> {
  const transport = getTransporter();

  // 开发模式：SMTP 未配置，直接返回验证码供测试
  if (!transport) {
    log.warn(`SMTP 未配置，开发模式验证码（${to} / ${purpose}）：${code}`);
    if (process.env.NODE_ENV === 'production') {
      return { sent: false };
    }
    return { sent: false, devCode: code };
  }

  const purposeText = PURPOSE_TEXT[purpose] ?? '验证';
  const mailOptions = {
    from: MAIL_FROM,
    to,
    subject: `【高考志愿填报AI助手】${purposeText}验证码`,
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,'PingFang SC',sans-serif;color:#1f2329">
        <h2 style="font-size:18px">您的${purposeText}验证码</h2>
        <p style="font-size:14px;color:#646a73">您好，您正在使用邮箱${purposeText}高考志愿填报AI助手，验证码如下：</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#FF7A45;margin:16px 0;font-family:monospace">${code}</div>
        <p style="font-size:12px;color:#8f959e">验证码 5 分钟内有效，请勿泄露给他人。若非本人操作，请忽略本邮件。</p>
      </div>
    `,
  };

  await transport.sendMail(mailOptions);
  return { sent: true };
}
