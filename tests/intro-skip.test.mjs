import test from "node:test";
import assert from "node:assert/strict";

/**
 * Mirror of the intro decision logic in tier-script.ts
 */
export function decideIntro({ tier, rmCheck, forceSkip, forceIntro, seen }) {
  if (forceSkip) return { decision: "skip", reason: "intro=0" };
  if (tier !== "full") return { decision: "skip", reason: "tier is " + tier };
  if (rmCheck) return { decision: "skip", reason: "prefers-reduced-motion" };
  if (seen && !forceIntro) return { decision: "skip", reason: "already seen in session" };
  return { decision: "play", reason: null };
}

test("Intro decision: fresh tab on Full tier plays intro", () => {
  const result = decideIntro({
    tier: "full",
    rmCheck: false,
    forceSkip: false,
    forceIntro: false,
    seen: false,
  });
  assert.equal(result.decision, "play");
});

test("Intro decision: already seen in session skips intro without ?intro=1", () => {
  const result = decideIntro({
    tier: "full",
    rmCheck: false,
    forceSkip: false,
    forceIntro: false,
    seen: true,
  });
  assert.equal(result.decision, "skip");
  assert.equal(result.reason, "already seen in session");
});

test("Intro decision: ?intro=1 overrides sessionStorage seen flag", () => {
  const result = decideIntro({
    tier: "full",
    rmCheck: false,
    forceSkip: false,
    forceIntro: true,
    seen: true,
  });
  assert.equal(result.decision, "play");
});

test("Intro decision: Lite tier skips intro", () => {
  const result = decideIntro({
    tier: "lite",
    rmCheck: false,
    forceSkip: false,
    forceIntro: false,
    seen: false,
  });
  assert.equal(result.decision, "skip");
  assert.equal(result.reason, "tier is lite");
});

test("Intro decision: Minimal tier skips intro", () => {
  const result = decideIntro({
    tier: "minimal",
    rmCheck: false,
    forceSkip: false,
    forceIntro: false,
    seen: false,
  });
  assert.equal(result.decision, "skip");
  assert.equal(result.reason, "tier is minimal");
});

test("Intro decision: prefers-reduced-motion skips intro even on desktop", () => {
  const result = decideIntro({
    tier: "full",
    rmCheck: true,
    forceSkip: false,
    forceIntro: false,
    seen: false,
  });
  assert.equal(result.decision, "skip");
  assert.equal(result.reason, "prefers-reduced-motion");
});

test("Intro decision: ?intro=0 explicitly forces skip", () => {
  const result = decideIntro({
    tier: "full",
    rmCheck: false,
    forceSkip: true,
    forceIntro: false,
    seen: false,
  });
  assert.equal(result.decision, "skip");
  assert.equal(result.reason, "intro=0");
});
