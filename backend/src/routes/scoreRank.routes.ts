/**
 * 位次反查路由
 */

import { Router } from 'express';
import { scoreRankLookup } from '@/controllers/scoreRank.controller.js';

const router: Router = Router();

/** POST /api/v1/score-rank/lookup */
router.post('/lookup', scoreRankLookup);

export default router;
