import type p5 from 'p5';
import type { BarkParams } from '@/types';
import { BarkGenerator } from './BarkGenerator';
import { speciesPalettes } from '@/algorithms';

/**
 * Pine bark generator
 *
 * Characteristics:
 * - Scaly, plate-like texture
 * - Deep vertical fissures
 * - Reddish-brown to gray-brown color
 * - Medium-sized irregular plates
 */
export class PineBark extends BarkGenerator {
  get species(): string {
    return 'pine';
  }

  constructor(p: p5, params?: Partial<BarkParams>) {
    const defaults = PineBark.createDefaultParams();
    super(p, { ...defaults, ...params });
  }

  getDefaultParams(): BarkParams {
    return PineBark.createDefaultParams();
  }

  static createDefaultParams(): BarkParams {
    return {
      species: 'pine',
      noise: {
        scale: 0.015,
        octaves: 5,
        lacunarity: 2.2,
        persistence: 0.5,
        seed: Math.floor(Math.random() * 10000),
      },
      warp: {
        strength: 0.8,
        iterations: 2,
        scale: 0.008,
      },
      voronoi: {
        cellDensity: 0.025,
        distanceFunction: 'euclidean',
        edgeWidth: 0.15,
        jitter: 0.8,
      },
      direction: {
        verticalBias: 0.6,    // Strong vertical fissures
        horizontalBias: 0.1,
        angle: 0,
      },
      colors: speciesPalettes.pine,
      ridgeIntensity: 0.4,
      contrast: 1.3,
    };
  }
}
