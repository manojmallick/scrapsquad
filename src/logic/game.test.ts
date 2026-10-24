import { describe, it, expect } from "vitest";

// --- Pure logic helpers for scrapsquad (no Phaser dependency) ---

// HP system
const MAX_HP = 3;
const PUNCH_DAMAGE = 1;
const LOOT_HEAL = 1;

function applyDamage(hp: number, damage: number): number {
  return Math.max(0, hp - damage);
}

function applyHeal(hp: number, heal: number): number {
  return Math.min(MAX_HP, hp + heal);
}

function isAlive(hp: number): boolean {
  return hp > 0;
}

// Score system
function scoreKnockout(currentScore: number): number {
  return currentScore + 1;
}

// Timer
function formatTime(seconds: number): string {
  return `${Math.max(0, seconds)}s`;
}

// AI simple chasing — direction toward target
function chaseDirection(from: { x: number; y: number }, to: { x: number; y: number }): { dx: number; dy: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { dx: dx / len, dy: dy / len };
}

function withinRange(a: { x: number; y: number }, b: { x: number; y: number }, range: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= range;
}

// Round outcome
function roundWinner(scoreYou: number, scoreAi: number): "you" | "ai" | "draw" {
  if (scoreYou > scoreAi) return "you";
  if (scoreAi > scoreYou) return "ai";
  return "draw";
}

// --- Tests ---

describe("HP system", () => {
  it("applyDamage reduces HP correctly", () => {
    expect(applyDamage(3, 1)).toBe(2);
    expect(applyDamage(3, 3)).toBe(0);
  });

  it("applyDamage clamps to 0", () => {
    expect(applyDamage(1, 5)).toBe(0);
  });

  it("applyHeal increases HP correctly", () => {
    expect(applyHeal(1, 1)).toBe(2);
  });

  it("applyHeal clamps to MAX_HP", () => {
    expect(applyHeal(3, 5)).toBe(MAX_HP);
  });

  it("isAlive returns false when hp is 0", () => {
    expect(isAlive(0)).toBe(false);
  });

  it("isAlive returns true when hp > 0", () => {
    expect(isAlive(1)).toBe(true);
    expect(isAlive(3)).toBe(true);
  });
});

describe("Score system", () => {
  it("scoreKnockout increments by 1", () => {
    expect(scoreKnockout(0)).toBe(1);
    expect(scoreKnockout(3)).toBe(4);
  });
});

describe("Timer", () => {
  it("formatTime shows seconds", () => {
    expect(formatTime(60)).toBe("60s");
    expect(formatTime(0)).toBe("0s");
  });

  it("formatTime clamps negatives to 0", () => {
    expect(formatTime(-5)).toBe("0s");
  });
});

describe("AI chase logic", () => {
  it("returns a unit vector toward target", () => {
    const dir = chaseDirection({ x: 0, y: 0 }, { x: 1, y: 0 });
    expect(dir.dx).toBeCloseTo(1, 5);
    expect(dir.dy).toBeCloseTo(0, 5);
  });

  it("handles diagonal targets", () => {
    const dir = chaseDirection({ x: 0, y: 0 }, { x: 1, y: 1 });
    const len = Math.hypot(dir.dx, dir.dy);
    expect(len).toBeCloseTo(1, 5);
  });
});

describe("withinRange", () => {
  it("returns true when close enough", () => {
    expect(withinRange({ x: 0, y: 0 }, { x: 3, y: 4 }, 5)).toBe(true);
  });

  it("returns false when too far", () => {
    expect(withinRange({ x: 0, y: 0 }, { x: 3, y: 4 }, 4)).toBe(false);
  });
});

describe("roundWinner", () => {
  it("returns you when your score is higher", () => {
    expect(roundWinner(2, 1)).toBe("you");
  });

  it("returns ai when ai score is higher", () => {
    expect(roundWinner(1, 3)).toBe("ai");
  });

  it("returns draw when tied", () => {
    expect(roundWinner(2, 2)).toBe("draw");
  });
});
