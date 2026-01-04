import type p5 from 'p5';
import type { NoiseParams, WarpParams } from '@/types';

/**
 * Extended noise utilities for bark texture generation.
 * Wraps p5's noise() with additional algorithms from "The Nature of Code".
 */

/**
 * Fractal Brownian Motion (fBm)
 * Sums multiple octaves of noise with decreasing amplitude and increasing frequency.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Noise parameters
 * @returns Noise value (0-1)
 */
export function fbm(
  p: p5,
  x: number,
  y: number,
  params: NoiseParams
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = params.scale;
  let maxValue = 0;

  for (let i = 0; i < params.octaves; i++) {
    value += amplitude * p.noise(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= params.persistence;
    frequency *= params.lacunarity;
  }

  return value / maxValue;
}

/**
 * Ridged multifractal noise
 * Creates sharp ridges by taking absolute value and inverting.
 * Good for deep bark fissures.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Noise parameters
 * @returns Noise value (0-1)
 */
export function ridgedNoise(
  p: p5,
  x: number,
  y: number,
  params: NoiseParams
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = params.scale;
  let maxValue = 0;

  for (let i = 0; i < params.octaves; i++) {
    // Get noise, center around 0, take absolute, invert
    let n = p.noise(x * frequency, y * frequency);
    n = Math.abs(n * 2 - 1); // 0-1 -> -1 to 1 -> 0 to 1 (V shape)
    n = 1 - n; // Invert: peaks become ridges

    value += amplitude * n * n; // Square for sharper ridges
    maxValue += amplitude;
    amplitude *= params.persistence;
    frequency *= params.lacunarity;
  }

  return value / maxValue;
}

/**
 * Domain warping
 * Distorts coordinates using noise to create organic, flowing patterns.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param warpParams - Warp configuration
 * @param noiseParams - Noise configuration for sampling
 * @returns Warped [x, y] coordinates
 */
export function domainWarp(
  p: p5,
  x: number,
  y: number,
  warpParams: WarpParams,
  noiseParams: NoiseParams
): [number, number] {
  let wx = x;
  let wy = y;

  for (let i = 0; i < warpParams.iterations; i++) {
    const offsetX = fbm(p, wx, wy, {
      ...noiseParams,
      scale: warpParams.scale,
    });
    const offsetY = fbm(p, wx + 5.2, wy + 1.3, {
      ...noiseParams,
      scale: warpParams.scale,
    });

    wx = x + warpParams.strength * (offsetX * 2 - 1);
    wy = y + warpParams.strength * (offsetY * 2 - 1);
  }

  return [wx, wy];
}

/**
 * Turbulence noise
 * Sum of absolute value noise at multiple frequencies.
 * Creates more chaotic, turbulent patterns.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Noise parameters
 * @returns Noise value (0-1)
 */
export function turbulence(
  p: p5,
  x: number,
  y: number,
  params: NoiseParams
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = params.scale;
  let maxValue = 0;

  for (let i = 0; i < params.octaves; i++) {
    const n = p.noise(x * frequency, y * frequency);
    value += amplitude * Math.abs(n * 2 - 1);
    maxValue += amplitude;
    amplitude *= params.persistence;
    frequency *= params.lacunarity;
  }

  return value / maxValue;
}

/**
 * Billowed noise
 * Absolute value of centered noise, creating cloud-like billows.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Noise parameters
 * @returns Noise value (0-1)
 */
export function billowedNoise(
  p: p5,
  x: number,
  y: number,
  params: NoiseParams
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = params.scale;
  let maxValue = 0;

  for (let i = 0; i < params.octaves; i++) {
    const n = p.noise(x * frequency, y * frequency);
    value += amplitude * Math.abs(n * 2 - 1);
    maxValue += amplitude;
    amplitude *= params.persistence;
    frequency *= params.lacunarity;
  }

  return value / maxValue;
}

/**
 * Apply directional bias to coordinates
 * Stretches noise in a particular direction.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param verticalBias - Vertical stretch (0-1, higher = more vertical features)
 * @param horizontalBias - Horizontal stretch (0-1, higher = more horizontal features)
 * @param angle - Rotation angle in radians
 * @returns Transformed [x, y] coordinates
 */
export function applyDirectionalBias(
  x: number,
  y: number,
  verticalBias: number,
  horizontalBias: number,
  angle: number = 0
): [number, number] {
  // Apply rotation first
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;

  // Apply anisotropic scaling
  // Higher vertical bias = compress Y = stretch features vertically
  const scaleX = 1 + horizontalBias;
  const scaleY = 1 + verticalBias;

  return [rx * scaleX, ry / scaleY];
}

/**
 * Mix two noise values with adjustable blend
 *
 * @param a - First noise value
 * @param b - Second noise value
 * @param t - Blend factor (0 = all a, 1 = all b)
 * @returns Blended value
 */
export function mixNoise(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

/**
 * Apply contrast adjustment to noise value
 *
 * @param value - Input value (0-1)
 * @param contrast - Contrast multiplier (1 = no change, >1 = more contrast)
 * @returns Adjusted value (clamped 0-1)
 */
export function applyContrast(value: number, contrast: number): number {
  // Center, scale, uncenter
  const adjusted = (value - 0.5) * contrast + 0.5;
  return Math.max(0, Math.min(1, adjusted));
}
