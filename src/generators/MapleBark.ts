import type p5 from 'p5';
import type { BarkParams } from '@/types';
import { BarkGenerator } from './BarkGenerator';
import {
  speciesPalettes,
  fbm,
  ridgedNoise,
  applyContrast,
  mixNoise,
  voronoiBark,
  voronoiEdges,
  applyDirectionalBias,
  domainWarp,
} from '@/algorithms';

/**
 * Maple bark generator
 *
 * Characteristics:
 * - Plated appearance with vertical fissures
 * - Gray to gray-brown color
 * - Becomes more furrowed with age
 * - Long vertical plates/strips
 */
export class MapleBark extends BarkGenerator {
  get species(): string {
    return 'maple';
  }

  constructor(p: p5, params?: Partial<BarkParams>) {
    const defaults = MapleBark.createDefaultParams();
    super(p, { ...defaults, ...params });
  }

  getDefaultParams(): BarkParams {
    return MapleBark.createDefaultParams();
  }

  static createDefaultParams(): BarkParams {
    return {
      species: 'maple',
      noise: {
        scale: 0.018,
        octaves: 5,
        lacunarity: 2.1,
        persistence: 0.45,
        seed: Math.floor(Math.random() * 10000),
      },
      warp: {
        strength: 0.5,
        iterations: 2,
        scale: 0.01,
      },
      voronoi: {
        cellDensity: 0.02,
        distanceFunction: 'manhattan', // More angular plates
        edgeWidth: 0.18,
        jitter: 0.6,
      },
      direction: {
        verticalBias: 0.5,    // Vertical plates
        horizontalBias: 0.15,
        angle: 0,
      },
      colors: speciesPalettes.maple,
      ridgeIntensity: 0.35,
      contrast: 1.2,
    };
  }

  /**
   * Override for maple's plated pattern with vertical fissures
   */
  protected calculateBarkValue(x: number, y: number): number {
    // Apply directional bias - emphasize vertical
    const [bx, by] = applyDirectionalBias(
      x,
      y,
      this.params.direction.verticalBias,
      this.params.direction.horizontalBias,
      this.params.direction.angle
    );

    // Domain warping
    const [wx, wy] = domainWarp(
      this.p,
      bx,
      by,
      this.params.warp,
      this.params.noise
    );

    // Base texture
    const baseNoise = fbm(this.p, wx, wy, this.params.noise);

    // Voronoi for plates
    const voronoi = voronoiBark(this.p, wx, wy, this.params.voronoi);
    const edges = voronoiEdges(this.p, wx, wy, this.params.voronoi);

    // Vertical fissure pattern
    const verticalFissure = ridgedNoise(this.p, wx * 0.3, wy, {
      ...this.params.noise,
      scale: this.params.noise.scale * 0.5,
      octaves: 3,
    });

    // Combine layers
    let value = mixNoise(baseNoise, voronoi, 0.4);
    value = mixNoise(value, verticalFissure, this.params.ridgeIntensity);

    // Deep cracks at edges
    value = value * (1 - edges * 0.6);

    // Apply contrast
    value = applyContrast(value, this.params.contrast);

    return value;
  }
}
