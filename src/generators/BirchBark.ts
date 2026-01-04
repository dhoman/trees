import type p5 from 'p5';
import type { BarkParams } from '@/types';
import { BarkGenerator } from './BarkGenerator';
import { speciesPalettes, fbm, applyContrast, getPixelColor } from '@/algorithms';
import { applyDirectionalBias, domainWarp } from '@/algorithms';

/**
 * Birch bark generator
 *
 * Characteristics:
 * - Smooth, papery texture
 * - Horizontal lenticels (dark marks)
 * - White/cream base with dark accents
 * - Peeling appearance in older bark
 */
export class BirchBark extends BarkGenerator {
  get species(): string {
    return 'birch';
  }

  constructor(p: p5, params?: Partial<BarkParams>) {
    const defaults = BirchBark.createDefaultParams();
    super(p, { ...defaults, ...params });
  }

  getDefaultParams(): BarkParams {
    return BirchBark.createDefaultParams();
  }

  static createDefaultParams(): BarkParams {
    return {
      species: 'birch',
      noise: {
        scale: 0.02,
        octaves: 4,
        lacunarity: 2.0,
        persistence: 0.4,
        seed: Math.floor(Math.random() * 10000),
      },
      warp: {
        strength: 0.3,        // Subtle warping
        iterations: 1,
        scale: 0.01,
      },
      voronoi: {
        cellDensity: 0.01,    // Not prominent
        distanceFunction: 'euclidean',
        edgeWidth: 0.05,
        jitter: 0.5,
      },
      direction: {
        verticalBias: 0.05,   // Minimal vertical
        horizontalBias: 0.8,  // Strong horizontal for lenticels
        angle: 0,
      },
      colors: speciesPalettes.birch,
      ridgeIntensity: 0.1,    // Smooth, minimal ridges
      contrast: 0.9,
    };
  }

  /**
   * Override for birch's unique horizontal lenticel pattern
   */
  protected calculateBarkValue(x: number, y: number): number {
    // Apply strong horizontal bias for lenticels
    const [bx, by] = applyDirectionalBias(
      x,
      y,
      this.params.direction.verticalBias,
      this.params.direction.horizontalBias,
      this.params.direction.angle
    );

    // Light warping
    const [wx, wy] = domainWarp(
      this.p,
      bx,
      by,
      this.params.warp,
      this.params.noise
    );

    // Base is mostly smooth/white
    const baseNoise = fbm(this.p, wx, wy, this.params.noise);

    // Horizontal band pattern for lenticels
    const bandFreq = 0.08;
    const bandNoise = this.p.noise(wx * 0.01, wy * bandFreq);
    const bands = Math.sin(wy * bandFreq * Math.PI * 2 + bandNoise * 5);
    const bandMask = Math.max(0, bands * 0.5 + 0.5);

    // Lenticel marks (dark horizontal dashes)
    const lenticelNoise = this.p.noise(wx * 0.05, wy * 0.02);
    const lenticelThreshold = 0.65;
    const hasLenticel = lenticelNoise > lenticelThreshold ? 1 : 0;

    // Combine: mostly bright with occasional dark marks
    let value = 0.85 + baseNoise * 0.15; // High base brightness

    // Apply lenticels as dark marks
    if (hasLenticel > 0) {
      const lenticelIntensity = (lenticelNoise - lenticelThreshold) / (1 - lenticelThreshold);
      value = value * (1 - lenticelIntensity * 0.7);
    }

    // Subtle banding
    value = value * (0.95 + bandMask * 0.05);

    // Apply contrast
    value = applyContrast(value, this.params.contrast);

    return Math.max(0, Math.min(1, value));
  }

  /**
   * Override generate to handle birch's inverted color scheme
   * (dark marks on light background)
   */
  generate(width: number, height: number) {
    // Create or resize graphics buffer
    if (!this.graphics || this.graphics.width !== width || this.graphics.height !== height) {
      this.graphics = this.p.createGraphics(width, height);
    }

    const g = this.graphics;
    g.loadPixels();

    this.p.noiseSeed(this.params.noise.seed);

    const d = this.p.pixelDensity();
    const pixelWidth = width * d;
    const pixelHeight = height * d;

    for (let py = 0; py < pixelHeight; py++) {
      for (let px = 0; px < pixelWidth; px++) {
        const x = (px / d) / width;
        const y = (py / d) / height;

        const value = this.calculateBarkValue(x * width, y * height);
        const variation = this.p.noise(x * 30, y * 30) * 0.3;

        // For birch, value maps differently:
        // High value = white bark, Low value = dark lenticel
        const [r, g, b, a] = getPixelColor(this.p, value, this.params.colors, variation);

        const idx = 4 * (py * pixelWidth + px);
        this.graphics.pixels[idx] = r;
        this.graphics.pixels[idx + 1] = g;
        this.graphics.pixels[idx + 2] = b;
        this.graphics.pixels[idx + 3] = a;
      }
    }

    g.updatePixels();
    return g;
  }
}
