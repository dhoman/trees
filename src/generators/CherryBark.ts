import type p5 from 'p5';
import type { BarkParams } from '@/types';
import { BarkGenerator } from './BarkGenerator';
import { speciesPalettes, fbm, applyContrast, mixNoise } from '@/algorithms';
import { applyDirectionalBias, domainWarp } from '@/algorithms';

/**
 * Cherry bark generator
 *
 * Characteristics:
 * - Smooth, glossy appearance (young trees)
 * - Horizontal lenticels
 * - Reddish-brown to copper color
 * - Satiny sheen
 */
export class CherryBark extends BarkGenerator {
  get species(): string {
    return 'cherry';
  }

  constructor(p: p5, params?: Partial<BarkParams>) {
    const defaults = CherryBark.createDefaultParams();
    super(p, { ...defaults, ...params });
  }

  getDefaultParams(): BarkParams {
    return CherryBark.createDefaultParams();
  }

  static createDefaultParams(): BarkParams {
    return {
      species: 'cherry',
      noise: {
        scale: 0.025,
        octaves: 3,           // Fewer octaves for smoother look
        lacunarity: 2.0,
        persistence: 0.35,
        seed: Math.floor(Math.random() * 10000),
      },
      warp: {
        strength: 0.2,        // Subtle warping
        iterations: 1,
        scale: 0.015,
      },
      voronoi: {
        cellDensity: 0.008,   // Very subtle
        distanceFunction: 'euclidean',
        edgeWidth: 0.05,
        jitter: 0.4,
      },
      direction: {
        verticalBias: 0.1,
        horizontalBias: 0.5,  // Horizontal lenticels
        angle: 0,
      },
      colors: speciesPalettes.cherry,
      ridgeIntensity: 0.1,    // Very smooth
      contrast: 1.1,
    };
  }

  /**
   * Override for cherry's smooth, glossy appearance with horizontal bands
   */
  protected calculateBarkValue(x: number, y: number): number {
    // Apply horizontal bias for lenticels
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

    // Smooth base
    const baseNoise = fbm(this.p, wx, wy, this.params.noise);

    // Horizontal band pattern
    const bandFreq = 0.04;
    const bandPhase = this.p.noise(wx * 0.005) * 10;
    const bands = Math.sin((wy * bandFreq + bandPhase) * Math.PI * 2);
    const bandValue = bands * 0.5 + 0.5;

    // Lenticel spots (small horizontal dashes)
    const lenticelPattern = this.p.noise(wx * 0.03, wy * 0.015);
    const lenticelMask = lenticelPattern > 0.6 ? (lenticelPattern - 0.6) * 2.5 : 0;

    // Combine: smooth base with subtle bands and lenticels
    let value = 0.5 + baseNoise * 0.3;

    // Add subtle horizontal banding
    value = mixNoise(value, bandValue * 0.6 + 0.4, 0.15);

    // Add lenticel marks (slightly darker spots)
    value = value * (1 - lenticelMask * 0.15);

    // Glossy highlight simulation (brighter in some areas)
    const highlight = fbm(this.p, wx * 0.5, wy * 0.5, {
      ...this.params.noise,
      octaves: 2,
    });
    value = value + highlight * 0.1;

    // Apply contrast
    value = applyContrast(value, this.params.contrast);

    return Math.max(0, Math.min(1, value));
  }
}
