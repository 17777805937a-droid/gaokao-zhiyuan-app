/**
 * 路由聚合
 */

import { Router } from 'express';
import scoreRankRoutes from './scoreRank.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import authRoutes from './auth.routes.js';

const router: Router = Router();

/** /api/v1/score-rank */
router.use('/score-rank', scoreRankRoutes);

/** /api/v1/recommendations */
router.use('/recommendations', recommendationRoutes);

/** /api/v1/auth */
router.use('/auth', authRoutes);

export default router;
