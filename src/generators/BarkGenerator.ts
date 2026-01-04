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
      // Set pixel density on the graphics buffer
      this.graphics.pixelDensity(1);

      // Optimize for frequent pixel reads (fixes willReadFrequently warning)
      const canvas = (this.graphics as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvas) {
        // Re-get context with optimization hint
        canvas.getContext('2d', { willReadFrequently: true });
      }
    }

    const g = this.graphics;

    // Set noise seed for reproducibility
    this.p.noiseSeed(this.params.noise.seed);

    // Load pixels for direct manipulation
    g.loadPixels();

    // Pre-allocate pixel array reference for faster access
    const pixels = g.pixels;

    // Generate texture pixel by pixel
    for (let py = 0; py < height; py++) {
      const rowOffset = py * width * 4;
      for (let px = 0; px < width; px++) {
        // Calculate bark value at this point
        const value = this.calculateBarkValue(px, py);

        // Get variation for color (simplified for performance)
        const variation = this.p.noise(px * 0.1, py * 0.1);

        // Map to color
        const [cr, cg, cb, ca] = getPixelColor(this.p, value, this.params.colors, variation);

        // Set pixel in the graphics buffer
        const idx = rowOffset + px * 4;
        pixels[idx] = cr;
        pixels[idx + 1] = cg;
        pixels[idx + 2] = cb;
        pixels[idx + 3] = ca;
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

  /**
   * Generate texture asynchronously with progress callback.
   * Yields control back to the browser periodically for UI updates.
   *
   * @param width - Texture width in pixels
   * @param height - Texture height in pixels
   * @param onProgress - Callback with progress (0-100) and optional status message
   * @returns Promise that resolves to the graphics buffer
   */
  async generateAsync(
    width: number,
    height: number,
    onProgress?: (percent: number, status?: string) => void
  ): Promise<RenderTarget> {
    // Create or resize graphics buffer
    if (!this.graphics || this.graphics.width !== width || this.graphics.height !== height) {
      this.graphics = this.p.createGraphics(width, height);
      this.graphics.pixelDensity(1);

      const canvas = (this.graphics as unknown as { canvas: HTMLCanvasElement }).canvas;
      if (canvas) {
        canvas.getContext('2d', { willReadFrequently: true });
      }
    }

    const g = this.graphics;

    // Set noise seed for reproducibility
    this.p.noiseSeed(this.params.noise.seed);

    // Load pixels for direct manipulation
    g.loadPixels();
    const pixels = g.pixels;

    const chunkSize = 16; // Rows per chunk - balance between progress updates and overhead
    let currentRow = 0;

    onProgress?.(0, 'Starting...');

    return new Promise((resolve) => {
      const processChunk = () => {
        const endRow = Math.min(currentRow + chunkSize, height);

        for (let py = currentRow; py < endRow; py++) {
          const rowOffset = py * width * 4;
          for (let px = 0; px < width; px++) {
            const value = this.calculateBarkValue(px, py);
            const variation = this.p.noise(px * 0.1, py * 0.1);
            const [cr, cg, cb, ca] = getPixelColor(this.p, value, this.params.colors, variation);

            const idx = rowOffset + px * 4;
            pixels[idx] = cr;
            pixels[idx + 1] = cg;
            pixels[idx + 2] = cb;
            pixels[idx + 3] = ca;
          }
        }

        currentRow = endRow;
        const percent = (currentRow / height) * 100;
        onProgress?.(percent, 'Generating...');

        if (currentRow < height) {
          // Yield to browser, then continue
          requestAnimationFrame(processChunk);
        } else {
          // Done
          g.updatePixels();
          onProgress?.(100, 'Complete!');
          resolve(g);
        }
      };

      // Start processing
      requestAnimationFrame(processChunk);
    });
  }
}
