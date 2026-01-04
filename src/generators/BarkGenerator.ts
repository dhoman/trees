import type p5 from 'p5';
import type { BarkParams, RenderTarget, ExportMetadata } from '@/types';
import {
  fbm,
  ridgedNoise,
  domainWarp,
  applyDirectionalBias,
  mixNoise,
  applyContrast,
  voronoiBark,
  voronoiEdges,
  getPixelColor,
} from '@/algorithms';

/**
 * Abstract base class for bark texture generators.
 * Subclasses implement species-specific parameter defaults and rendering variations.
 */
export abstract class BarkGenerator {
  protected p: p5;
  protected params: BarkParams;
  protected graphics: RenderTarget | null = null;

  constructor(p: p5, params: BarkParams) {
    this.p = p;
    this.params = { ...params };
  }

  /**
   * Get the species name for this generator
   */
  abstract get species(): string;

  /**
   * Get default parameters for this species
   */
  abstract getDefaultParams(): BarkParams;

  /**
   * Generate bark texture to a p5.Graphics buffer
   *
   * @param width - Texture width in pixels
   * @param height - Texture height in pixels
   * @returns p5.Graphics buffer with rendered texture
   */
  generate(width: number, height: number): RenderTarget {
    // Create or resize graphics buffer
    if (!this.graphics || this.graphics.width !== width || this.graphics.height !== height) {
      this.graphics = this.p.createGraphics(width, height);
    }

    const g = this.graphics;
    g.loadPixels();

    // Set noise seed for reproducibility
    this.p.noiseSeed(this.params.noise.seed);

    const d = this.p.pixelDensity();
    const pixelWidth = width * d;
    const pixelHeight = height * d;

    // Generate texture pixel by pixel
    for (let py = 0; py < pixelHeight; py++) {
      for (let px = 0; px < pixelWidth; px++) {
        // Normalize coordinates to 0-1 range (based on logical size)
        const x = (px / d) / width;
        const y = (py / d) / height;

        // Calculate bark value at this point
        const value = this.calculateBarkValue(x * width, y * height);

        // Get variation for color
        const variation = this.p.noise(x * 50, y * 50);

        // Map to color
        const [r, g, b, a] = getPixelColor(this.p, value, this.params.colors, variation);

        // Set pixel (accounting for pixel density)
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

  /**
   * Calculate the bark texture value at a given point.
   * This is the core algorithm combining all noise functions.
   * Can be overridden by subclasses for species-specific effects.
   *
   * @param x - X coordinate in texture space
   * @param y - Y coordinate in texture space
   * @returns Normalized value (0-1)
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

    // Calculate ridged noise for fissures
    const ridged = ridgedNoise(this.p, wx, wy, {
      ...this.params.noise,
      scale: this.params.noise.scale * 0.5,
    });

    // Calculate Voronoi for cellular patterns
    const voronoi = voronoiBark(this.p, wx, wy, this.params.voronoi);
    const edges = voronoiEdges(this.p, wx, wy, this.params.voronoi);

    // Combine noise layers
    let value = baseNoise;

    // Mix in ridged noise based on intensity
    value = mixNoise(value, ridged, this.params.ridgeIntensity);

    // Add Voronoi cellular texture
    value = mixNoise(value, voronoi, 0.3);

    // Darken edges/cracks
    value = value * (1 - edges * 0.5);

    // Apply contrast
    value = applyContrast(value, this.params.contrast);

    return value;
  }

  /**
   * Get current parameters
   */
  getParams(): BarkParams {
    return { ...this.params };
  }

  /**
   * Update parameters (will require regeneration)
   */
  setParams(params: Partial<BarkParams>): void {
    this.params = {
      ...this.params,
      ...params,
      noise: { ...this.params.noise, ...params.noise },
      warp: { ...this.params.warp, ...params.warp },
      voronoi: { ...this.params.voronoi, ...params.voronoi },
      direction: { ...this.params.direction, ...params.direction },
      colors: { ...this.params.colors, ...params.colors },
    };
  }

  /**
   * Reset to default parameters for this species
   */
  resetToDefaults(): void {
    this.params = this.getDefaultParams();
  }

  /**
   * Export texture as PNG blob with metadata
   */
  async export(): Promise<Blob> {
    if (!this.graphics) {
      throw new Error('No texture generated. Call generate() first.');
    }

    // Get canvas from graphics
    const canvas = (this.graphics as unknown as { canvas: HTMLCanvasElement }).canvas;

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/png');
    });
  }

  /**
   * Get export metadata for this texture
   */
  getExportMetadata(): ExportMetadata {
    return {
      generator: 'bark-generator',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      species: this.species,
      params: this.getParams(),
    };
  }

  /**
   * Get the rendered graphics buffer (or null if not generated)
   */
  getGraphics(): RenderTarget | null {
    return this.graphics;
  }
}
