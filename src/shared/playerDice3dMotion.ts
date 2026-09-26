/**
 * Cinematic throw kinematics for player-TV 3D dice (Phase 2).
 * Pure curves only — no rigid-body engine. Outcomes stay predetermined.
 */

/** First-contact window as a fraction of throw time (before stagger). */
const LAND_BASE = 0.5
/** Must stay ≥ LAND_JITTER so handfuls keep a clear land order. */
const LAND_STAGGER = 0.032
const LAND_JITTER = 0.028
const LAND_MAX = 0.68

/** First bounce duration / height after impact (fraction of throw). */
const BOUNCE1_DUR = 0.11
const BOUNCE1_HEIGHT = 0.55

/** Optional second bounce (starts near end of first). */
const BOUNCE2_GAP = 0.095
const BOUNCE2_DUR = 0.085
const BOUNCE2_HEIGHT = 0.22

export type DieThrowMotion = {
  /** Global t (0..1) when this die first hits the table. */
  landT: number
  /** Peak flight arc height (world units above the planar lerp). */
  flightPeak: number
  /** 0 = no second bounce; ~0.3–1 scales the second hop. */
  bounce2: number
  /** Settle wobble amplitude (radians) right after land. */
  wobble: number
  /** Phase offset so dice don't wobble in sync. */
  wobblePhase: number
}

export type DieThrowSample = {
  /** 0..1 planar lerp start→end (held at 1 after land). */
  planar: number
  /** Extra Y above planar-lerped height (arc + bounces). */
  height: number
  /** 0..1 orientation blend toward the predetermined land face. */
  orient: number
  /** Remaining tumble spin scale (1 mid-air → 0 after impact). */
  spin: number
  /** Soft settle wobble (radians) around the landed pose. */
  wobbleX: number
  wobbleY: number
  wobbleZ: number
}

export function clamp01(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t
}

export function easeOutCubic(t: number): number {
  const u = clamp01(t)
  return 1 - (1 - u) ** 3
}

/** Harder settle into the table than cubic — reads as impact. */
export function easeOutQuint(t: number): number {
  const u = clamp01(t)
  return 1 - (1 - u) ** 5
}

/** Half-sine pulse used for bounce hops. */
export function bouncePulse(u: number, duration: number, height: number): number {
  if (duration <= 0 || height <= 0 || u <= 0 || u >= duration) return 0
  return height * Math.sin((u / duration) * Math.PI)
}

/**
 * Plan per-die timing: staggered first contact, optional second bounce, settle wobble.
 * Pass a deterministic `rng` in tests; production uses Math.random.
 */
export function planDieThrowMotions(count: number, rng: () => number = Math.random): DieThrowMotion[] {
  const n = Math.max(0, Math.floor(count))
  const motions: DieThrowMotion[] = []
  for (let i = 0; i < n; i += 1) {
    const landT = Math.min(LAND_MAX, LAND_BASE + i * LAND_STAGGER + rng() * LAND_JITTER)
    const bounce2 = rng() < 0.7 ? 0.35 + rng() * 0.55 : 0
    motions.push({
      landT,
      flightPeak: 1.15 + rng() * 0.55,
      bounce2,
      wobble: 0.045 + rng() * 0.04,
      wobblePhase: rng() * Math.PI * 2
    })
  }
  return motions
}

function flightHeight(approach: number, peak: number): number {
  // Full sine arc that clears mid-flight, then meets the table at impact.
  return peak * Math.sin(approach * Math.PI) * (0.92 + 0.08 * (1 - approach))
}

function postLandHeight(after: number, motion: DieThrowMotion): number {
  const h1 = bouncePulse(after, BOUNCE1_DUR, BOUNCE1_HEIGHT * (0.75 + motion.flightPeak * 0.18))
  if (motion.bounce2 <= 0) return h1
  const h2 = bouncePulse(after - BOUNCE2_GAP, BOUNCE2_DUR, BOUNCE2_HEIGHT * motion.bounce2)
  return Math.max(h1, h2)
}

/**
 * Sample cinematic throw pose factors at global progress `t` in [0, 1].
 * At t≥1 every die is at rest on its predetermined face (planar=1, orient=1, spin=0, height≈0).
 */
export function sampleDieThrow(t: number, motion: DieThrowMotion): DieThrowSample {
  const u = clamp01(t)
  const land = Math.max(0.05, Math.min(0.95, motion.landT))
  const approach = clamp01(u / land)

  const planar = u >= land ? 1 : easeOutQuint(approach)
  // Lock the fair face a touch before contact so the bounce reads as a hop on the result.
  const orient = easeOutCubic(clamp01(approach / 0.92))
  const spin =
    u >= land ? 0 : Math.pow(1 - easeOutCubic(clamp01(approach / 0.88)), 1.15)

  let height: number
  if (u < land) {
    height = flightHeight(approach, motion.flightPeak)
  } else {
    height = postLandHeight(u - land, motion)
  }

  let wobbleX = 0
  let wobbleY = 0
  let wobbleZ = 0
  if (u >= land) {
    const settleWindow = Math.max(1e-6, 1 - land)
    const settle = clamp01((u - land) / settleWindow)
    // Stronger wobble just after impact, then exponential decay to rest.
    const damp = Math.exp(-4.2 * settle) * (1 - settle * 0.4)
    const amp = motion.wobble * damp
    wobbleX = Math.sin(settle * 17 + motion.wobblePhase) * amp
    wobbleY = Math.sin(settle * 13 + motion.wobblePhase * 1.6) * amp * 0.5
    wobbleZ = Math.cos(settle * 15 + motion.wobblePhase * 0.7) * amp * 0.65
  }

  return { planar, height, orient, spin, wobbleX, wobbleY, wobbleZ }
}
