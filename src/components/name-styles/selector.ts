import type { NameStyleId } from "./types.ts";

export const ALL_TEXT_STYLES: NameStyleId[] = [
  "wide-thin",
  "heavy-stacked",
  "letter-rise",
  "slice",
  "decode",
  "outline-fill",
  "weight-sweep",
];

/**
 * Builds candidate pool with weights and picks a style that differs from lastId.
 * - Minimal tier: always 'wide-thin'
 * - Lite tier: styles 1-7 equally weighted (particles excluded)
 * - Full tier: styles 1-7 weight 1 each, particles weight 2 (if available)
 */
export function pickNextStyle(
  lastId: string | null,
  tier: "full" | "lite" | "minimal",
  isParticlesAvailable: boolean,
  randomFn: () => number = Math.random
): NameStyleId {
  if (tier === "minimal") {
    return "wide-thin";
  }

  // Construct weighted pool excluding lastId
  const pool: NameStyleId[] = [];

  for (const style of ALL_TEXT_STYLES) {
    if (style !== lastId) {
      pool.push(style);
    }
  }

  // Add particles with 2x weight on full tier
  if (tier === "full" && isParticlesAvailable && lastId !== "particles") {
    pool.push("particles");
    pool.push("particles");
  }

  if (pool.length === 0) {
    return "wide-thin";
  }

  const index = Math.floor(randomFn() * pool.length);
  return pool[index];
}
