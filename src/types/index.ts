import type p5 from 'p5';

/**
 * HSB color representation [hue, saturation, brightness]
 * Hue: 0-360, Saturation: 0-100, Brightness: 0-100
 */
export type HSBColor = [number, number, number];

/**
 * Color palette for bark generation
 */
export interface ColorPalette {
  baseColor: HSBColor;
  shadowColor: HSBColor;
  highlightColor: HSBColor;
  /** Random hue shift range (0-30 typical) */
  colorVariation: number;
}

/**
 * Core noise parameters for fBm
 */
export interface NoiseParams {
  /** Base noise scale (0.001 - 0.1) */
  scale: number;
  /** Number of noise octaves (1-8) */
  octaves: number;
  /** Frequency multiplier per octave (1.5-3.0) */
  lacunarity: number;
  /** Amplitude decay per octave (0.3-0.7) */
  persistence: number;
  /** Seed for noise generation */
  seed: number;
}

/**
 * Domain warping parameters
 */
export interface WarpParams {
  /** Intensity of coordinate displacement (0-2) */
  strength: number;
  /** Recursive warping passes (1-3) */
  iterations: number;
  /** Scale for warp noise */
  scale: number;
}

/**
 * Voronoi/cellular noise parameters
 */
export interface VoronoiParams {
  /** Seed point frequency (0.01-0.1) */
  cellDensity: number;
  /** Distance calculation method */
  distanceFunction: 'euclidean' | 'manhattan' | 'chebyshev';
  /** Fissure/crack width between cells (0-0.3) */
  edgeWidth: number;
  /** Randomness of cell positions (0-1) */
  jitter: number;
}

/**
 * Directional bias for anisotropic effects
 */
export interface DirectionalParams {
  /** Stretch factor in Y direction (0-1) - creates vertical fissures */
  verticalBias: number;
  /** Stretch factor in X direction (0-1) - creates horizontal bands */
  horizontalBias: number;
  /** Rotation angle in radians */
  angle: number;
}

/**
 * Complete bark generation parameters
 */
export interface BarkParams {
  /** Species name for this configuration */
  species: string;
  /** Primary noise configuration */
  noise: NoiseParams;
  /** Domain warping configuration */
  warp: WarpParams;
  /** Cellular pattern configuration */
  voronoi: VoronoiParams;
  /** Directional stretch/bias */
  direction: DirectionalParams;
  /** Color palette */
  colors: ColorPalette;
  /** Ridge noise intensity (0-1) - for deep ridges */
  ridgeIntensity: number;
  /** Overall contrast (0.5-2.0) */
  contrast: number;
}

/**
 * Feature vector extracted from generated texture
 */
export interface FeatureVector {
  /** Relative energy in vertical frequencies */
  verticalEnergy: number;
  /** Relative energy in horizontal frequencies */
  horizontalEnergy: number;
  /** Density of detected ridges/edges */
  ridgeDensity: number;
  /** Average size of detected plates/cells */
  plateSize: number;
  /** Variance in luminance values */
  colorVariance: number;
  /** Mean luminance */
  meanLuminance: number;
  /** Dominant hue */
  dominantHue: number;
  /** Edge orientation histogram (8 bins) */
  edgeOrientations: number[];
}

/**
 * Acceptable ranges for species features
 */
export interface SpeciesFeatureRanges {
  species: string;
  features: {
    verticalEnergy: [number, number];
    horizontalEnergy: [number, number];
    ridgeDensity: [number, number];
    plateSize: [number, number];
    colorVariance: [number, number];
  };
  /** Required percentage of features within range */
  confidenceThreshold: number;
}

/**
 * Result from species classification
 */
export interface ClassificationResult {
  /** Primary species match */
  primary: {
    species: string;
    confidence: number;
  };
  /** Alternative matches sorted by confidence */
  alternatives: Array<{
    species: string;
    confidence: number;
  }>;
  /** Features that didn't match expected ranges */
  mismatches: Array<{
    feature: string;
    actual: number;
    expected: [number, number];
  }>;
}

/**
 * Result from texture validation against specific species
 */
export interface ValidationResult {
  /** Whether texture passes as the target species */
  isValid: boolean;
  /** Overall confidence score (0-1) */
  confidence: number;
  /** Per-feature match results */
  featureMatches: Record<string, {
    value: number;
    inRange: boolean;
    expected: [number, number];
  }>;
  /** Suggestions for parameter adjustments */
  suggestions: string[];
}

/**
 * Export metadata embedded in PNG
 */
export interface ExportMetadata {
  generator: 'bark-generator';
  version: string;
  timestamp: string;
  species: string;
  params: BarkParams;
  validation?: ClassificationResult;
}

/**
 * p5.js instance type (for instance mode)
 */
export type P5Instance = p5;

/**
 * Generator render target
 */
export type RenderTarget = p5.Graphics;
