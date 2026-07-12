/**
 * 认证路由
 */

import { Router } from 'express';
import {
  sendCodeHandler,
  registerHandler,
  loginHandler,
  getMeHandler,
  saveProfileHandler,
} from '@/controllers/auth.controller.js';
import { requireAuth } from '@/middleware/auth.js';

const router: Router = Router();

/** POST /api/v1/auth/send-code */
router.post('/send-code', sendCodeHandler);
/** POST /api/v1/auth/register */
router.post('/register', registerHandler);
/** POST /api/v1/auth/login */
router.post('/login', loginHandler);
/** GET /api/v1/auth/me （需登录） */
router.get('/me', requireAuth, getMeHandler);
/** PUT /api/v1/auth/profile （需登录） */
router.put('/profile', requireAuth, saveProfileHandler);

export default router;
