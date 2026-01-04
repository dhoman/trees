import type p5 from 'p5';
import type { FeatureVector, RenderTarget } from '@/types';

/**
 * Feature extractor for analyzing generated bark textures.
 * Extracts measurable characteristics for species classification.
 */
export class FeatureExtractor {
  private p: p5;

  constructor(p: p5) {
    this.p = p;
  }

  /**
   * Extract all features from a texture
   *
   * @param texture - p5.Graphics texture to analyze
   * @returns Feature vector with all measured characteristics
   */
  extract(texture: RenderTarget): FeatureVector {
    texture.loadPixels();

    const width = texture.width;
    const height = texture.height;
    const pixels = texture.pixels;
    const d = this.p.pixelDensity();

    // Convert to grayscale array for analysis
    const grayscale = this.toGrayscale(pixels, width * d, height * d);

    // Extract individual features
    const { verticalEnergy, horizontalEnergy } = this.analyzeDirectionalEnergy(
      grayscale,
      width * d,
      height * d
    );

    const ridgeDensity = this.analyzeRidgeDensity(grayscale, width * d, height * d);
    const plateSize = this.analyzePlateSize(grayscale, width * d, height * d);
    const { variance: colorVariance, mean: meanLuminance } = this.analyzeColorStats(
      grayscale
    );
    const dominantHue = this.analyzeDominantHue(pixels);
    const edgeOrientations = this.analyzeEdgeOrientations(
      grayscale,
      width * d,
      height * d
    );

    return {
      verticalEnergy,
      horizontalEnergy,
      ridgeDensity,
      plateSize,
      colorVariance,
      meanLuminance,
      dominantHue,
      edgeOrientations,
    };
  }

  /**
   * Convert RGBA pixels to grayscale array (0-1)
   */
  private toGrayscale(
    pixels: number[],
    width: number,
    height: number
  ): Float32Array {
    const gray = new Float32Array(width * height);

    for (let i = 0; i < width * height; i++) {
      const r = pixels[i * 4];
      const g = pixels[i * 4 + 1];
      const b = pixels[i * 4 + 2];
      // Standard luminance weights
      gray[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    return gray;
  }

  /**
   * Analyze directional energy using gradient analysis.
   * Approximates FFT-based frequency analysis.
   */
  private analyzeDirectionalEnergy(
    grayscale: Float32Array,
    width: number,
    height: number
  ): { verticalEnergy: number; horizontalEnergy: number } {
    let verticalSum = 0;
    let horizontalSum = 0;
    let count = 0;

    // Compute gradients using Sobel-like operators
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // Horizontal gradient (detects vertical edges)
        const gx =
          -grayscale[idx - 1] +
          grayscale[idx + 1] +
          -2 * grayscale[idx - width - 1] +
          2 * grayscale[idx - width + 1] +
          -grayscale[idx + width - 1] +
          grayscale[idx + width + 1];

        // Vertical gradient (detects horizontal edges)
        const gy =
          -grayscale[idx - width] +
          grayscale[idx + width] +
          -2 * grayscale[idx - width - 1] +
          2 * grayscale[idx + width - 1] +
          -grayscale[idx - width + 1] +
          grayscale[idx + width + 1];

        verticalSum += Math.abs(gx);
        horizontalSum += Math.abs(gy);
        count++;
      }
    }

    // Normalize to 0-1 range
    const total = verticalSum + horizontalSum;
    if (total === 0) {
      return { verticalEnergy: 0.5, horizontalEnergy: 0.5 };
    }

    // Scale to reasonable 0-1 range (empirically determined)
    const maxExpectedGradient = 0.3;

    return {
      verticalEnergy: Math.min(1, (verticalSum / count) / maxExpectedGradient),
      horizontalEnergy: Math.min(1, (horizontalSum / count) / maxExpectedGradient),
    };
  }

  /**
   * Analyze ridge density using edge detection magnitude
   */
  private analyzeRidgeDensity(
    grayscale: Float32Array,
    width: number,
    height: number
  ): number {
    let edgeSum = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // Compute gradient magnitude (simplified Sobel)
        const gx = grayscale[idx + 1] - grayscale[idx - 1];
        const gy = grayscale[idx + width] - grayscale[idx - width];
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        edgeSum += magnitude;
        count++;
      }
    }

    // Normalize: typical bark has magnitude around 0.1-0.3
    const avgMagnitude = edgeSum / count;
    return Math.min(1, avgMagnitude / 0.2);
  }

  /**
   * Analyze average plate/cell size using run-length analysis.
   * Measures how many consecutive pixels have similar values.
   */
  private analyzePlateSize(
    grayscale: Float32Array,
    width: number,
    height: number
  ): number {
    const threshold = 0.1; // Similarity threshold
    let totalRunLength = 0;
    let runCount = 0;

    // Analyze horizontal runs
    for (let y = 0; y < height; y++) {
      let runLength = 1;
      for (let x = 1; x < width; x++) {
        const curr = grayscale[y * width + x];
        const prev = grayscale[y * width + x - 1];

        if (Math.abs(curr - prev) < threshold) {
          runLength++;
        } else {
          totalRunLength += runLength;
          runCount++;
          runLength = 1;
        }
      }
      totalRunLength += runLength;
      runCount++;
    }

    // Average run length relative to image width
    const avgRunLength = totalRunLength / runCount;
    const normalizedSize = avgRunLength / width;

    // Scale to 0-1 (typical plates are 5-30% of image width)
    return Math.min(1, normalizedSize * 3);
  }

  /**
   * Analyze color/luminance statistics
   */
  private analyzeColorStats(
    grayscale: Float32Array
  ): { variance: number; mean: number } {
    const n = grayscale.length;

    // Calculate mean
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += grayscale[i];
    }
    const mean = sum / n;

    // Calculate variance
    let varSum = 0;
    for (let i = 0; i < n; i++) {
      const diff = grayscale[i] - mean;
      varSum += diff * diff;
    }
    const variance = varSum / n;

    // Normalize variance (typical range 0-0.1)
    return {
      variance: Math.min(1, variance * 10),
      mean,
    };
  }

  /**
   * Analyze dominant hue from RGB pixels
   */
  private analyzeDominantHue(pixels: number[]): number {
    let hueSum = 0;
    let count = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i] / 255;
      const g = pixels[i + 1] / 255;
      const b = pixels[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;

      if (delta > 0.01) {
        // Skip near-gray pixels
        let hue = 0;
        if (max === r) {
          hue = ((g - b) / delta) % 6;
        } else if (max === g) {
          hue = (b - r) / delta + 2;
        } else {
          hue = (r - g) / delta + 4;
        }
        hue = (hue * 60 + 360) % 360;

        hueSum += hue;
        count++;
      }
    }

    return count > 0 ? hueSum / count : 0;
  }

  /**
   * Analyze edge orientations (8-bin histogram)
   */
  private analyzeEdgeOrientations(
    grayscale: Float32Array,
    width: number,
    height: number
  ): number[] {
    const bins = new Array(8).fill(0);
    const binSize = Math.PI / 4; // 8 bins covering 0-2π

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        const gx = grayscale[idx + 1] - grayscale[idx - 1];
        const gy = grayscale[idx + width] - grayscale[idx - width];
        const magnitude = Math.sqrt(gx * gx + gy * gy);

        if (magnitude > 0.02) {
          // Only count significant edges
          let angle = Math.atan2(gy, gx);
          if (angle < 0) angle += Math.PI * 2;

          const binIndex = Math.floor(angle / binSize) % 8;
          bins[binIndex] += magnitude;
        }
      }
    }

    // Normalize histogram
    const total = bins.reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (let i = 0; i < 8; i++) {
        bins[i] /= total;
      }
    }

    return bins;
  }
}
