import type p5 from 'p5';
import type { BarkParams } from '@/types';
import { BarkGenerator } from './BarkGenerator';
import { PineBark } from './PineBark';
import { OakBark } from './OakBark';
import { BirchBark } from './BirchBark';
import { MapleBark } from './MapleBark';
import { CherryBark } from './CherryBark';

export { BarkGenerator } from './BarkGenerator';
export { PineBark } from './PineBark';
export { OakBark } from './OakBark';
export { BirchBark } from './BirchBark';
export { MapleBark } from './MapleBark';
export { CherryBark } from './CherryBark';

/**
 * Registry of available bark generators by species name
 */
export const speciesRegistry: Record<
  string,
  new (p: p5, params?: Partial<BarkParams>) => BarkGenerator
> = {
  pine: PineBark,
  oak: OakBark,
  birch: BirchBark,
  maple: MapleBark,
  cherry: CherryBark,
};

/**
 * List of available species names
 */
export const availableSpecies = Object.keys(speciesRegistry);

/**
 * Factory function to create a bark generator for a given species
 *
 * @param p - p5 instance
 * @param species - Species name
 * @param params - Optional parameter overrides
 * @returns BarkGenerator instance
 */
export function createGenerator(
  p: p5,
  species: string,
  params?: Partial<BarkParams>
): BarkGenerator {
  const GeneratorClass = speciesRegistry[species.toLowerCase()];

  if (!GeneratorClass) {
    throw new Error(
      `Unknown species: ${species}. Available: ${availableSpecies.join(', ')}`
    );
  }

  return new GeneratorClass(p, params);
}

/**
 * Get default parameters for a species without creating a generator
 *
 * @param species - Species name
 * @returns Default BarkParams for the species
 */
export function getSpeciesDefaults(species: string): BarkParams {
  switch (species.toLowerCase()) {
    case 'pine':
      return PineBark.createDefaultParams();
    case 'oak':
      return OakBark.createDefaultParams();
    case 'birch':
      return BirchBark.createDefaultParams();
    case 'maple':
      return MapleBark.createDefaultParams();
    case 'cherry':
      return CherryBark.createDefaultParams();
    default:
      throw new Error(
        `Unknown species: ${species}. Available: ${availableSpecies.join(', ')}`
      );
  }
}

/**
 * Interpolate between two species' default parameters
 * Useful for creating hybrid bark textures
 *
 * @param species1 - First species name
 * @param species2 - Second species name
 * @param t - Interpolation factor (0 = species1, 1 = species2)
 * @returns Interpolated BarkParams
 */
export function interpolateSpecies(
  species1: string,
  species2: string,
  t: number
): BarkParams {
  const p1 = getSpeciesDefaults(species1);
  const p2 = getSpeciesDefaults(species2);

  const lerp = (a: number, b: number) => a + (b - a) * t;

  return {
    species: `${species1}-${species2}-${Math.round(t * 100)}`,
    noise: {
      scale: lerp(p1.noise.scale, p2.noise.scale),
      octaves: Math.round(lerp(p1.noise.octaves, p2.noise.octaves)),
      lacunarity: lerp(p1.noise.lacunarity, p2.noise.lacunarity),
      persistence: lerp(p1.noise.persistence, p2.noise.persistence),
      seed: p1.noise.seed, // Keep first species' seed
    },
    warp: {
      strength: lerp(p1.warp.strength, p2.warp.strength),
      iterations: Math.round(lerp(p1.warp.iterations, p2.warp.iterations)),
      scale: lerp(p1.warp.scale, p2.warp.scale),
    },
    voronoi: {
      cellDensity: lerp(p1.voronoi.cellDensity, p2.voronoi.cellDensity),
      distanceFunction: t < 0.5 ? p1.voronoi.distanceFunction : p2.voronoi.distanceFunction,
      edgeWidth: lerp(p1.voronoi.edgeWidth, p2.voronoi.edgeWidth),
      jitter: lerp(p1.voronoi.jitter, p2.voronoi.jitter),
    },
    direction: {
      verticalBias: lerp(p1.direction.verticalBias, p2.direction.verticalBias),
      horizontalBias: lerp(p1.direction.horizontalBias, p2.direction.horizontalBias),
      angle: lerp(p1.direction.angle, p2.direction.angle),
    },
    colors: {
      baseColor: [
        lerp(p1.colors.baseColor[0], p2.colors.baseColor[0]),
        lerp(p1.colors.baseColor[1], p2.colors.baseColor[1]),
        lerp(p1.colors.baseColor[2], p2.colors.baseColor[2]),
      ],
      shadowColor: [
        lerp(p1.colors.shadowColor[0], p2.colors.shadowColor[0]),
        lerp(p1.colors.shadowColor[1], p2.colors.shadowColor[1]),
        lerp(p1.colors.shadowColor[2], p2.colors.shadowColor[2]),
      ],
      highlightColor: [
        lerp(p1.colors.highlightColor[0], p2.colors.highlightColor[0]),
        lerp(p1.colors.highlightColor[1], p2.colors.highlightColor[1]),
        lerp(p1.colors.highlightColor[2], p2.colors.highlightColor[2]),
      ],
      colorVariation: lerp(p1.colors.colorVariation, p2.colors.colorVariation),
    },
    ridgeIntensity: lerp(p1.ridgeIntensity, p2.ridgeIntensity),
    contrast: lerp(p1.contrast, p2.contrast),
  };
}
