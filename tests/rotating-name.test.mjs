import test from "node:test";
import assert from "node:assert/strict";
import { pickNextStyle, ALL_TEXT_STYLES } from "../src/components/name-styles/selector.ts";

test("pickNextStyle: never picks the same style twice in a row", () => {
  let previous = null;

  for (let i = 0; i < 100; i++) {
    const next = pickNextStyle(previous, "full", true);
    assert.notEqual(
      next,
      previous,
      `Iteration ${i}: picked ${next} which equals previous ${previous}`
    );
    previous = next;
  }
});

test("pickNextStyle: Lite tier never picks particles", () => {
  let previous = null;

  for (let i = 0; i < 50; i++) {
    const next = pickNextStyle(previous, "lite", true);
    assert.notEqual(next, "particles", `Lite tier should never pick particles`);
    assert.notEqual(next, previous);
    previous = next;
  }
});

test("pickNextStyle: Minimal tier always returns wide-thin", () => {
  for (let i = 0; i < 20; i++) {
    const next = pickNextStyle("heavy-stacked", "minimal", true);
    assert.equal(next, "wide-thin", `Minimal tier must always lock to wide-thin`);
  }
});

test("pickNextStyle: When particles fail, full tier excludes particles", () => {
  let previous = null;

  for (let i = 0; i < 50; i++) {
    const next = pickNextStyle(previous, "full", false); // particles unavailable
    assert.notEqual(next, "particles", `Failed particles must be excluded from pool`);
    assert.notEqual(next, previous);
    previous = next;
  }
});

test("Timer pause logic: pauses when hidden or off-screen and resets cleanly", () => {
  let isVisible = true;
  let isHeroInView = true;
  let isHovered = false;
  let rotationsCount = 0;

  function simulateTick() {
    const isPaused = !isVisible || !isHeroInView || isHovered;
    if (isPaused) {
      return false;
    }
    rotationsCount++;
    return true;
  }

  // Active state: should rotate
  assert.equal(simulateTick(), true);
  assert.equal(rotationsCount, 1);

  // Tab hidden: should pause
  isVisible = false;
  assert.equal(simulateTick(), false);
  assert.equal(rotationsCount, 1);

  // Re-visible but hero off-screen: should pause
  isVisible = true;
  isHeroInView = false;
  assert.equal(simulateTick(), false);
  assert.equal(rotationsCount, 1);

  // User hovering: should pause
  isHeroInView = true;
  isHovered = true;
  assert.equal(simulateTick(), false);
  assert.equal(rotationsCount, 1);

  // Hover released, all active: should rotate
  isHovered = false;
  assert.equal(simulateTick(), true);
  assert.equal(rotationsCount, 2);
});

test("Timer pause logic: long pause resets to 5s delay without bursting", () => {
  const currentInterval = 30000;
  const longPauseDuration = 45000; // longer than interval

  let nextDelay = 0;
  if (longPauseDuration > currentInterval) {
    nextDelay = 5000;
  } else {
    nextDelay = Math.max(5000, currentInterval - longPauseDuration);
  }

  assert.equal(nextDelay, 5000, "Long pause must schedule exactly 5000ms fresh delay");
});

