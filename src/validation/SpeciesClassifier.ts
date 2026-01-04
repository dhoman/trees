import type p5 from 'p5';
import type {
  FeatureVector,
  ClassificationResult,
  ValidationResult,
  RenderTarget,
} from '@/types';
import { FeatureExtractor } from './FeatureExtractor';
import {
  speciesFeatureRanges,
  adjustmentSuggestions,
  getDefinedSpecies,
} from './features';

/**
 * Rule-based species classifier for bark textures.
 * Compares extracted features against defined species ranges.
 */
export class SpeciesClassifier {
  private extractor: FeatureExtractor;

  constructor(p: p5) {
    this.extractor = new FeatureExtractor(p);
  }

  /**
   * Classify a texture against all known species
   *
   * @param texture - p5.Graphics texture to classify
   * @returns Classification result with primary match and alternatives
   */
  classify(texture: RenderTarget): ClassificationResult {
    const features = this.extractor.extract(texture);
    const species = getDefinedSpecies();

    // Score each species
    const scores: Array<{ species: string; confidence: number }> = [];

    for (const sp of species) {
      const ranges = speciesFeatureRanges[sp];
      const matchResult = this.scoreAgainstRanges(features, ranges.features);
      scores.push({
        species: sp,
        confidence: matchResult.score,
      });
    }

    // Sort by confidence
    scores.sort((a, b) => b.confidence - a.confidence);

    // Find mismatches for primary species
    const primaryRanges = speciesFeatureRanges[scores[0].species];
    const mismatches = this.findMismatches(features, primaryRanges.features);

    return {
      primary: scores[0],
      alternatives: scores.slice(1),
      mismatches,
    };
  }

  /**
   * Validate texture against a specific species
   *
   * @param texture - p5.Graphics texture to validate
   * @param species - Target species name
   * @returns Detailed validation result
   */
  validate(texture: RenderTarget, species: string): ValidationResult {
    const sp = species.toLowerCase();
    const ranges = speciesFeatureRanges[sp];

    if (!ranges) {
      return {
        isValid: false,
        confidence: 0,
        featureMatches: {},
        suggestions: [`Unknown species: ${species}`],
      };
    }

    const features = this.extractor.extract(texture);
    const matchResult = this.scoreAgainstRanges(features, ranges.features);

    // Build feature match details
    const featureMatches: ValidationResult['featureMatches'] = {};
    const suggestions: string[] = [];

    for (const [key, range] of Object.entries(ranges.features)) {
      const value = features[key as keyof FeatureVector] as number;
      const inRange = value >= range[0] && value <= range[1];

      featureMatches[key] = {
        value,
        inRange,
        expected: range,
      };

      // Generate suggestions for mismatches
      if (!inRange) {
        const adjustment = adjustmentSuggestions[key];
        if (adjustment) {
          if (value < range[0]) {
            suggestions.push(`${key}: ${adjustment.increase}`);
          } else {
            suggestions.push(`${key}: ${adjustment.decrease}`);
          }
        }
      }
    }

    return {
      isValid: matchResult.score >= ranges.confidenceThreshold,
      confidence: matchResult.score,
      featureMatches,
      suggestions,
    };
  }

  /**
   * Extract features from texture (exposed for UI)
   */
  extractFeatures(texture: RenderTarget): FeatureVector {
    return this.extractor.extract(texture);
  }

  /**
   * Score features against species ranges
   */
  private scoreAgainstRanges(
    features: FeatureVector,
    ranges: Record<string, [number, number]>
  ): { score: number; matches: number; total: number } {
    let matches = 0;
    let total = 0;
    let weightedScore = 0;

    for (const [key, range] of Object.entries(ranges)) {
      const value = features[key as keyof FeatureVector];

      if (typeof value === 'number') {
        total++;
        const [min, max] = range;

        if (value >= min && value <= max) {
          // Perfect match
          matches++;
          weightedScore += 1;
        } else {
          // Partial score based on distance to range
          const rangeSize = max - min;
          const distance = Math.min(
            Math.abs(value - min),
            Math.abs(value - max)
          );

          // Score decreases with distance, capped at 0
          const partialScore = Math.max(0, 1 - distance / rangeSize);
          weightedScore += partialScore * 0.5; // Partial matches worth less
        }
      }
    }

    return {
      score: total > 0 ? weightedScore / total : 0,
      matches,
      total,
    };
  }

  /**
   * Find features that don't match expected ranges
   */
  private findMismatches(
    features: FeatureVector,
    ranges: Record<string, [number, number]>
  ): ClassificationResult['mismatches'] {
    const mismatches: ClassificationResult['mismatches'] = [];

    for (const [key, range] of Object.entries(ranges)) {
      const value = features[key as keyof FeatureVector];

      if (typeof value === 'number') {
        if (value < range[0] || value > range[1]) {
          mismatches.push({
            feature: key,
            actual: value,
            expected: range,
          });
        }
      }
    }

    return mismatches;
  }
}
