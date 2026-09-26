/**
 * Cinematic throw kinematics for player-TV 3D dice (Phase 2).
 * Pure curves only — no rigid-body engine. Outcomes stay predetermined.
 *
 * d20 natural 20 / natural 1 get **TV-distance** flair (large scale punch,
 * light flash envelopes, camera punch) — gold celebratory vs blood thud.
 * Glyph gold/blood tones live in the look module.
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

export type DieThrowFlair = 'none' | 'nat20' | 'nat1'

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
  /** d20 crit / fail flourish; other faces stay `'none'`. */
  flair: DieThrowFlair
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
  /** Body scale multiplier — big punch on crit/fail so it reads across a room. */
  scale: number
  /** Warm gold flash envelope for nat20 (0..1). */
  glow: number
  /** Dark blood flash envelope for nat1 (0..1). */
  shade: number
  /** Camera punch toward this die (0..1). */
  cameraPunch: number
}

export type DieThrowPlanInput = {
  sides: number
  value: number
  dropped?: boolean
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
 * Natural 20 / natural 1 flair only on kept d20s (advantage discards stay neutral).
 * Fair face is already known before the throw — this never re-rolls.
 */
export function dieThrowFlair(die: DieThrowPlanInput): DieThrowFlair {
  if (die.dropped || die.sides !== 20) return 'none'
  if (die.value === 20) return 'nat20'
  if (die.value === 1) return 'nat1'
  return 'none'
}

function planOneMotion(index: number, flair: DieThrowFlair, rng: () => number): DieThrowMotion {
  let landT = Math.min(LAND_MAX, LAND_BASE + index * LAND_STAGGER + rng() * LAND_JITTER)
  let flightPeak = 1.15 + rng() * 0.55
  let bounce2 = rng() < 0.7 ? 0.35 + rng() * 0.55 : 0
  let wobble = 0.045 + rng() * 0.04

  if (flair === 'nat20') {
    // High theatrical arc + lively hops — readable celebration from the couch.
    landT = Math.min(LAND_MAX, landT + 0.03)
    flightPeak = 1.85 + rng() * 0.4
    bounce2 = 0.9 + rng() * 0.2
    wobble = 0.09 + rng() * 0.04
  } else if (flair === 'nat1') {
    // Low heavy drop, dead thud, wilt — no second hop.
    landT = Math.max(0.4, landT - 0.05)
    flightPeak = 0.55 + rng() * 0.25
    bounce2 = 0
    wobble = 0.12 + rng() * 0.05
  }

  return {
    landT,
    flightPeak,
    bounce2,
    wobble,
    wobblePhase: rng() * Math.PI * 2,
    flair
  }
}

/**
 * Plan per-die timing: staggered first contact, optional second bounce, settle wobble.
 * Pass a die list to attach nat20/nat1 flair; a bare count keeps every die neutral.
 * Pass a deterministic `rng` in tests; production uses Math.random.
 */
export function planDieThrowMotions(
  diceOrCount: number | DieThrowPlanInput[],
  rng: () => number = Math.random
): DieThrowMotion[] {
  if (typeof diceOrCount === 'number') {
    const n = Math.max(0, Math.floor(diceOrCount))
    return Array.from({ length: n }, (_, i) => planOneMotion(i, 'none', rng))
  }
  return diceOrCount.map((die, i) => planOneMotion(i, dieThrowFlair(die), rng))
}

function flightHeight(approach: number, peak: number): number {
  // Full sine arc that clears mid-flight, then meets the table at impact.
  return peak * Math.sin(approach * Math.PI) * (0.92 + 0.08 * (1 - approach))
}

function postLandHeight(after: number, motion: DieThrowMotion): number {
  const bounce1Scale = motion.flair === 'nat1' ? 0.28 : motion.flair === 'nat20' ? 1.45 : 1
  const h1 = bouncePulse(
    after,
    BOUNCE1_DUR * (motion.flair === 'nat1' ? 0.7 : motion.flair === 'nat20' ? 1.15 : 1),
    BOUNCE1_HEIGHT * bounce1Scale * (0.75 + motion.flightPeak * 0.18)
  )
  if (motion.bounce2 <= 0) return h1
  const h2 = bouncePulse(
    after - BOUNCE2_GAP,
    BOUNCE2_DUR * (motion.flair === 'nat20' ? 1.1 : 1),
    BOUNCE2_HEIGHT * motion.bounce2 * (motion.flair === 'nat20' ? 1.25 : 1)
  )
  return Math.max(h1, h2)
}

/** Hard flash then lingering plateau — must read on a living-room TV. */
function flashEnvelope(after: number, settle: number, flashDur: number, linger: number): number {
  const hit = bouncePulse(after, flashDur, 1)
  const hold = Math.exp(-linger * settle)
  return clamp01(Math.max(hit, hold * 0.85))
}

/**
 * Sample cinematic throw pose factors at global progress `t` in [0, 1].
 * At t≥1 every die is at rest on its predetermined face (planar=1, orient=1, spin=0, height≈0).
 */
export function sampleDieThrow(t: number, motion: DieThrowMotion): DieThrowSample {
  const u = clamp01(t)
  const land = Math.max(0.05, Math.min(0.95, motion.landT))
  const approach = clamp01(u / land)
  const flair = motion.flair

  const planarEase = flair === 'nat1' ? easeOutQuint(approach ** 0.9) : easeOutQuint(approach)
  const planar = u >= land ? 1 : planarEase
  // Lock the fair face a touch before contact so the bounce reads as a hop on the result.
  const orientGate = flair === 'nat20' ? 0.86 : flair === 'nat1' ? 0.97 : 0.92
  const orient = easeOutCubic(clamp01(approach / orientGate))
  let spin =
    u >= land ? 0 : Math.pow(1 - easeOutCubic(clamp01(approach / 0.88)), flair === 'nat20' ? 0.95 : 1.15)
  // Crit keeps a proud twist after land; fail dies hard at impact.
  if (u >= land && flair === 'nat20') {
    const settle = clamp01((u - land) / Math.max(1e-6, 1 - land))
    spin = 0.35 * Math.exp(-3.8 * settle)
  }

  let height: number
  if (u < land) {
    height = flightHeight(approach, motion.flightPeak)
  } else {
    height = postLandHeight(u - land, motion)
  }

  let wobbleX = 0
  let wobbleY = 0
  let wobbleZ = 0
  let scale = 1
  let glow = 0
  let shade = 0
  let cameraPunch = 0

  if (u >= land) {
    const settleWindow = Math.max(1e-6, 1 - land)
    const settle = clamp01((u - land) / settleWindow)
    const after = u - land

    if (flair === 'nat1') {
      // Heavy thud: deep squash, dark linger, wilt lean — obvious from across the room.
      const damp = Math.exp(-2.1 * settle) * (1 - settle * 0.2)
      const amp = motion.wobble * damp * 1.35
      wobbleX = Math.sin(settle * 10 + motion.wobblePhase) * amp
      wobbleY = Math.sin(settle * 7 + motion.wobblePhase * 1.3) * amp * 0.4
      wobbleZ = (0.65 + Math.cos(settle * 8 + motion.wobblePhase * 0.5) * 0.35) * amp
      const squash = 0.26 * bouncePulse(after, 0.18, 1)
      const wilt = 0.1 * Math.exp(-1.6 * settle)
      scale = 1 - squash - wilt
      shade = flashEnvelope(after, settle, 0.14, 1.4)
      cameraPunch = flashEnvelope(after, settle, 0.12, 2.2)
    } else if (flair === 'nat20') {
      // Celebration: big pop, gold linger, lively settle — readable from the couch.
      const damp = Math.exp(-2.8 * settle) * (1 - settle * 0.35)
      const amp = motion.wobble * damp * 1.25
      wobbleX = Math.sin(settle * 18 + motion.wobblePhase) * amp
      wobbleY = Math.sin(settle * 14 + motion.wobblePhase * 1.7) * amp * 0.6
      wobbleZ = Math.cos(settle * 16 + motion.wobblePhase * 0.8) * amp * 0.7
      const pop = 0.32 * bouncePulse(after, 0.2, 1)
      const proud = 0.14 * Math.exp(-1.3 * settle)
      scale = 1 + pop + proud
      glow = flashEnvelope(after, settle, 0.16, 1.2)
      cameraPunch = flashEnvelope(after, settle, 0.14, 1.8)
    } else {
      const damp = Math.exp(-4.2 * settle) * (1 - settle * 0.4)
      const amp = motion.wobble * damp
      wobbleX = Math.sin(settle * 17 + motion.wobblePhase) * amp
      wobbleY = Math.sin(settle * 13 + motion.wobblePhase * 1.6) * amp * 0.5
      wobbleZ = Math.cos(settle * 15 + motion.wobblePhase * 0.7) * amp * 0.65
    }
  }

  return { planar, height, orient, spin, wobbleX, wobbleY, wobbleZ, scale, glow, shade, cameraPunch }
}
