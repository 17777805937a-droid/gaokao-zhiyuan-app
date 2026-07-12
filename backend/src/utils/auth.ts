/**
 * 认证工具：密码哈希、JWT 签发/校验、验证码生成
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, CODE_LENGTH } from '@/config/env.js';

/** JWT 载荷 */
export interface JwtPayload {
  userId: number;
  email: string;
}

/** 密码哈希 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** 校验密码 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** 签发 JWT */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

/** 校验 JWT，失败返回 null */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** 生成数字验证码 */
export function generateCode(len: number = CODE_LENGTH): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += Math.floor(Math.random() * 10).toString();
  }
  return s;
}
