import type p5 from 'p5';
import type { BarkParams } from '@/types';
import { BarkGenerator } from './BarkGenerator';
import { speciesPalettes, ridgedNoise, fbm, mixNoise, applyContrast } from '@/algorithms';
import { applyDirectionalBias, domainWarp } from '@/algorithms';

/**
 * Oak bark generator
 *
 * Characteristics:
 * - Deep, irregular ridges and furrows
 * - Very rough, rugged texture
 * - Dark gray-brown color
 * - More chaotic than pine, less regular plates
 */
export class OakBark extends BarkGenerator {
  get species(): string {
    return 'oak';
  }

  constructor(p: p5, params?: Partial<BarkParams>) {
    const defaults = OakBark.createDefaultParams();
    super(p, { ...defaults, ...params });
  }

  getDefaultParams(): BarkParams {
    return OakBark.createDefaultParams();
  }

  static createDefaultParams(): BarkParams {
    return {
      species: 'oak',
      noise: {
        scale: 0.012,
        octaves: 6,
        lacunarity: 2.0,
        persistence: 0.55,
        seed: Math.floor(Math.random() * 10000),
      },
      warp: {
        strength: 1.2,        // More warping for irregular look
        iterations: 2,
        scale: 0.006,
      },
      voronoi: {
        cellDensity: 0.015,   // Larger, less regular cells
        distanceFunction: 'euclidean',
        edgeWidth: 0.25,      // Wider fissures
        jitter: 0.9,          // More randomness
      },
      direction: {
        verticalBias: 0.3,    // Less directional than pine
        horizontalBias: 0.2,
        angle: 0,
      },
      colors: speciesPalettes.oak,
      ridgeIntensity: 0.7,    // Strong ridges
      contrast: 1.5,          // High contrast for deep texture
    };
  }

  /**
   * Override to add extra roughness characteristic of oak
   */
  protected calculateBarkValue(x: number, y: number): number {
    // Apply directional bias
    const [bx, by] = applyDirectionalBias(
      x,
      y,
      this.params.direction.verticalBias,
      this.params.direction.horizontalBias,
      this.params.direction.angle
    );

    // Apply domain warping
    const [wx, wy] = domainWarp(
      this.p,
      bx,
      by,
      this.params.warp,
      this.params.noise
    );

    // Calculate base fBm noise
    const baseNoise = fbm(this.p, wx, wy, this.params.noise);

    // Oak has more prominent ridged noise
    const ridged = ridgedNoise(this.p, wx, wy, {
      ...this.params.noise,
      scale: this.params.noise.scale * 0.4,
    });

    // Secondary ridged layer at different scale for complexity
    const ridged2 = ridgedNoise(this.p, wx * 1.5, wy * 1.5, {
      ...this.params.noise,
      scale: this.params.noise.scale * 0.8,
      octaves: 3,
    });

    // Combine: heavy ridge emphasis
    let value = mixNoise(baseNoise, ridged, this.params.ridgeIntensity);
    value = mixNoise(value, ridged2, 0.3);

    // Add fine detail noise
    const detail = fbm(this.p, wx * 3, wy * 3, {
      ...this.params.noise,
      scale: this.params.noise.scale * 2,
      octaves: 3,
    });
    value = mixNoise(value, detail, 0.15);

    // Apply contrast
    value = applyContrast(value, this.params.contrast);

    return value;
  }
}
