export type Tier = "free" | "paid";

const AI_MODELS: Record<Tier, string> = {
  free: "gpt-4o-mini",
  paid: "gpt-4o",
};

export const VISION_MODEL = "gpt-4o-mini";

export function getModelByTier(tier: Tier): string {
  return AI_MODELS[tier];
}
