/**
 * 推荐生成路由
 */

import { Router } from 'express';
import { recommendationGenerate } from '@/controllers/recommendation.controller.js';

const router: Router = Router();

/** POST /api/v1/recommendations/generate */
router.post('/generate', recommendationGenerate);

export default router;
