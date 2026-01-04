import type { SpeciesFeatureRanges } from '@/types';

/**
 * Species feature range definitions for rule-based validation.
 *
 * These ranges define the expected characteristics of each species' bark texture.
 * Values are normalized 0-1 ranges extracted from generated textures.
 */

export const speciesFeatureRanges: Record<string, SpeciesFeatureRanges> = {
  pine: {
    species: 'pine',
    features: {
      // Strong vertical energy from fissures
      verticalEnergy: [0.5, 0.85],
      // Low horizontal energy
      horizontalEnergy: [0.1, 0.4],
      // Medium ridge density
      ridgeDensity: [0.3, 0.6],
      // Medium-sized plates
      plateSize: [0.15, 0.4],
      // Moderate color variance
      colorVariance: [0.15, 0.4],
    },
    confidenceThreshold: 0.6,
  },

  oak: {
    species: 'oak',
    features: {
      // Less directional than pine
      verticalEnergy: [0.3, 0.6],
      horizontalEnergy: [0.25, 0.55],
      // High ridge density - very rough
      ridgeDensity: [0.5, 0.85],
      // Irregular, varied plate sizes
      plateSize: [0.2, 0.5],
      // High color variance due to deep texture
      colorVariance: [0.25, 0.5],
    },
    confidenceThreshold: 0.55,
  },

  birch: {
    species: 'birch',
    features: {
      // Low vertical energy - smooth
      verticalEnergy: [0.05, 0.3],
      // Higher horizontal energy from lenticels
      horizontalEnergy: [0.4, 0.8],
      // Low ridge density - smooth bark
      ridgeDensity: [0.05, 0.25],
      // No significant plates
      plateSize: [0.0, 0.15],
      // Low color variance (mostly white)
      colorVariance: [0.1, 0.35],
    },
    confidenceThreshold: 0.65,
  },

  maple: {
    species: 'maple',
    features: {
      // Moderate vertical from plates
      verticalEnergy: [0.35, 0.65],
      // Low-moderate horizontal
      horizontalEnergy: [0.15, 0.45],
      // Medium ridge density
      ridgeDensity: [0.25, 0.5],
      // Distinct plates
      plateSize: [0.2, 0.45],
      // Moderate color variance
      colorVariance: [0.15, 0.35],
    },
    confidenceThreshold: 0.55,
  },

  cherry: {
    species: 'cherry',
    features: {
      // Low vertical energy - smooth
      verticalEnergy: [0.1, 0.35],
      // Moderate horizontal from lenticels
      horizontalEnergy: [0.3, 0.6],
      // Very low ridge density - glossy
      ridgeDensity: [0.05, 0.2],
      // Minimal plates
      plateSize: [0.0, 0.2],
      // Low-moderate variance
      colorVariance: [0.1, 0.3],
    },
    confidenceThreshold: 0.6,
  },
};

/**
 * Get feature ranges for a specific species
 */
export function getFeatureRanges(species: string): SpeciesFeatureRanges | null {
  return speciesFeatureRanges[species.toLowerCase()] || null;
}

/**
 * Get all available species with feature definitions
 */
export function getDefinedSpecies(): string[] {
  return Object.keys(speciesFeatureRanges);
}

/**
 * Feature descriptions for UI display
 */
export const featureDescriptions: Record<string, string> = {
  verticalEnergy: 'Strength of vertical patterns (fissures, ridges)',
  horizontalEnergy: 'Strength of horizontal patterns (bands, lenticels)',
  ridgeDensity: 'Overall roughness and ridge frequency',
  plateSize: 'Average size of bark plates or scales',
  colorVariance: 'Variation in color/luminance across texture',
};

/**
 * Suggestions for adjusting parameters based on feature mismatches
 */
export const adjustmentSuggestions: Record<string, Record<'increase' | 'decrease', string>> = {
  verticalEnergy: {
    increase: 'Increase direction.verticalBias or add more ridged noise',
    decrease: 'Decrease direction.verticalBias or reduce ridge intensity',
  },
  horizontalEnergy: {
    increase: 'Increase direction.horizontalBias',
    decrease: 'Decrease direction.horizontalBias',
  },
  ridgeDensity: {
    increase: 'Increase ridgeIntensity or noise.octaves',
    decrease: 'Decrease ridgeIntensity or reduce contrast',
  },
  plateSize: {
    increase: 'Decrease voronoi.cellDensity (larger cells)',
    decrease: 'Increase voronoi.cellDensity (smaller cells)',
  },
  colorVariance: {
    increase: 'Increase contrast or add more noise detail',
    decrease: 'Decrease contrast or reduce noise.persistence',
  },
};
