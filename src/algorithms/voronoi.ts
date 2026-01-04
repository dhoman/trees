import type p5 from 'p5';
import type { VoronoiParams } from '@/types';

/**
 * Voronoi/Worley noise implementation for cellular bark patterns.
 * Creates natural-looking plate and scale boundaries.
 */

interface CellPoint {
  x: number;
  y: number;
}

/**
 * Distance functions for Voronoi calculation
 */
const distanceFunctions = {
  euclidean: (dx: number, dy: number) => Math.sqrt(dx * dx + dy * dy),
  manhattan: (dx: number, dy: number) => Math.abs(dx) + Math.abs(dy),
  chebyshev: (dx: number, dy: number) => Math.max(Math.abs(dx), Math.abs(dy)),
};

/**
 * Generate deterministic cell points for a grid cell
 * Uses p5's noise seeded with cell coordinates for consistent results
 */
function getCellPoints(
  p: p5,
  cellX: number,
  cellY: number,
  jitter: number
): CellPoint {
  // Use noise for deterministic pseudo-random placement
  const noiseX = p.noise(cellX * 100, cellY * 100);
  const noiseY = p.noise(cellX * 100 + 50, cellY * 100 + 50);

  return {
    x: cellX + 0.5 + (noiseX - 0.5) * jitter,
    y: cellY + 0.5 + (noiseY - 0.5) * jitter,
  };
}

/**
 * Calculate Voronoi/Worley noise at a point
 * Returns distances to nearest cell points.
 *
 * @param p - p5 instance
 * @param x - X coordinate (in texture space)
 * @param y - Y coordinate (in texture space)
 * @param params - Voronoi parameters
 * @returns Object with F1 (nearest) and F2 (second nearest) distances
 */
export function voronoiNoise(
  p: p5,
  x: number,
  y: number,
  params: VoronoiParams
): { f1: number; f2: number; cellId: number } {
  // Scale coordinates by cell density
  const scaledX = x * params.cellDensity;
  const scaledY = y * params.cellDensity;

  // Get the cell this point is in
  const cellX = Math.floor(scaledX);
  const cellY = Math.floor(scaledY);

  const distFn = distanceFunctions[params.distanceFunction];

  let f1 = Infinity; // Nearest distance
  let f2 = Infinity; // Second nearest
  let nearestCellId = 0;

  // Check 3x3 neighborhood of cells
  for (let offsetY = -1; offsetY <= 1; offsetY++) {
    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      const neighborX = cellX + offsetX;
      const neighborY = cellY + offsetY;

      const point = getCellPoints(p, neighborX, neighborY, params.jitter);

      const dx = scaledX - point.x;
      const dy = scaledY - point.y;
      const dist = distFn(dx, dy);

      if (dist < f1) {
        f2 = f1;
        f1 = dist;
        // Create a unique cell ID from coordinates
        nearestCellId = neighborX * 1000 + neighborY;
      } else if (dist < f2) {
        f2 = dist;
      }
    }
  }

  return { f1, f2, cellId: nearestCellId };
}

/**
 * Get normalized Voronoi value suitable for texture generation
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Voronoi parameters
 * @returns Normalized value (0-1)
 */
export function voronoiValue(
  p: p5,
  x: number,
  y: number,
  params: VoronoiParams
): number {
  const { f1 } = voronoiNoise(p, x, y, params);
  // Normalize based on expected max distance (roughly 0.7 for unit cell)
  return Math.min(1, f1 / 0.7);
}

/**
 * Get edge/crack value from Voronoi
 * High values at cell boundaries, low in cell centers.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Voronoi parameters
 * @returns Edge value (0-1), 1 = on edge
 */
export function voronoiEdges(
  p: p5,
  x: number,
  y: number,
  params: VoronoiParams
): number {
  const { f1, f2 } = voronoiNoise(p, x, y, params);

  // Edge is where f2 - f1 is small
  const edgeDist = f2 - f1;

  // Map to 0-1 range, with edgeWidth controlling falloff
  if (params.edgeWidth === 0) {
    return edgeDist < 0.01 ? 1 : 0;
  }

  const edgeValue = 1 - Math.min(1, edgeDist / params.edgeWidth);
  return edgeValue;
}

/**
 * Get cell-based value (different value per cell)
 * Useful for giving each bark plate a slightly different shade.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Voronoi parameters
 * @returns Per-cell value (0-1)
 */
export function voronoiCellValue(
  p: p5,
  x: number,
  y: number,
  params: VoronoiParams
): number {
  const { cellId } = voronoiNoise(p, x, y, params);
  // Use cell ID to generate consistent per-cell value
  return p.noise(cellId * 0.1, cellId * 0.2);
}

/**
 * Combined Voronoi texture suitable for bark plates
 * Combines cell interior shading with edge cracks.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Voronoi parameters
 * @returns Combined value (0-1)
 */
export function voronoiBark(
  p: p5,
  x: number,
  y: number,
  params: VoronoiParams
): number {
  const cellValue = voronoiCellValue(p, x, y, params);
  const edgeValue = voronoiEdges(p, x, y, params);

  // Darken edges (cracks between plates)
  return cellValue * (1 - edgeValue * 0.8);
}

/**
 * Crackle pattern (inverse of standard Voronoi)
 * Creates web-like crack patterns.
 *
 * @param p - p5 instance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param params - Voronoi parameters
 * @returns Crackle value (0-1)
 */
export function crackleNoise(
  p: p5,
  x: number,
  y: number,
  params: VoronoiParams
): number {
  const { f1, f2 } = voronoiNoise(p, x, y, params);
  // F2 - F1 creates crackle pattern
  return Math.min(1, (f2 - f1) * 2);
}
