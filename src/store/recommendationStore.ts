/**
 * 推荐结果状态管理
 */

import { create } from 'zustand';
import type { TierRecommendations, Tier, Recommendation, RecommendationRequest } from '@/types/recommendation';
import { getRecommendationsWithRetry } from '@/data/dynamic';

interface GeneratedPrefs {
  preferredMajors: string[];
  preferredCities: string[];
  preferredLevels: string[];
}

interface RecommendationState {
  recommendations: TierRecommendations;
  activeTier: Tier;
  totalCount: number;
  generating: boolean;
  generatedAt: string | null;
  /** 上次生成时使用的偏好快照，用于检测「偏好已变更需重新生成」 */
  lastGeneratedPrefs: GeneratedPrefs | null;

  setRecommendations: (data: TierRecommendations) => void;
  setActiveTier: (tier: Tier) => void;
  setGenerating: (generating: boolean) => void;
  generateMock: (req: RecommendationRequest, onStatus?: (msg: string) => void) => Promise<void>;
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
  lastGeneratedPrefs: null,

  setRecommendations: (data) => {
    const totalCount = data.rush.length + data.stable.length + data.preserve.length + data.cushion.length;
    set({ recommendations: data, totalCount });
  },

  setActiveTier: (tier) => set({ activeTier: tier }),

  setGenerating: (generating) => set({ generating }),

  generateMock: async (req, onStatus) => {
    const data = await getRecommendationsWithRetry(req, onStatus);
    const totalCount = data.rush.length + data.stable.length + data.preserve.length + data.cushion.length;
    set({
      recommendations: data,
      totalCount,
      generating: false,
      generatedAt: new Date().toISOString(),
      lastGeneratedPrefs: {
        preferredMajors: req.preferredMajors ?? [],
        preferredCities: req.preferredCities ?? [],
        preferredLevels: req.preferredLevels ?? [],
      },
    });
  },

  getActiveRecommendations: () => {
    const { recommendations, activeTier } = get();
    return recommendations[activeTier] ?? [];
  },
}));
