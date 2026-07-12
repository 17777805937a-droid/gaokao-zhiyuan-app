/**
 * 推荐结果状态管理
 */

import { create } from 'zustand';
import type { TierRecommendations, Tier, Recommendation, RecommendationRequest } from '@/types/recommendation';
import { generateMockRecommendations } from '@/hooks/useScoreRankLookup';

interface RecommendationState {
  recommendations: TierRecommendations;
  activeTier: Tier;
  totalCount: number;
  generating: boolean;
  generatedAt: string | null;

  setRecommendations: (data: TierRecommendations) => void;
  setActiveTier: (tier: Tier) => void;
  setGenerating: (generating: boolean) => void;
  generateMock: (req: RecommendationRequest) => Promise<void>;
  getActiveRecommendations: () => Recommendation[];
}

const emptyRecommendations: TierRecommendations = {
  rush: [],
  stable: [],
  preserve: [],
  cushion: [],
};

export const useRecommendationStore = create<RecommendationState>()((set, get) => ({
  recommendations: emptyRecommendations,
  activeTier: 'stable',
  totalCount: 0,
  generating: false,
  generatedAt: null,

  setRecommendations: (data) => {
    const totalCount = data.rush.length + data.stable.length + data.preserve.length + data.cushion.length;
    set({ recommendations: data, totalCount });
  },

  setActiveTier: (tier) => set({ activeTier: tier }),

  setGenerating: (generating) => set({ generating }),

  generateMock: async (req) => {
    const data = await generateMockRecommendations(req);
    const totalCount = data.rush.length + data.stable.length + data.preserve.length + data.cushion.length;
    set({
      recommendations: data,
      totalCount,
      generating: false,
      generatedAt: new Date().toISOString(),
    });
  },

  getActiveRecommendations: () => {
    const { recommendations, activeTier } = get();
    return recommendations[activeTier] ?? [];
  },
}));
