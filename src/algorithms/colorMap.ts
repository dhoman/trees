import type p5 from 'p5';
import type { ColorPalette, HSBColor } from '@/types';

/**
 * Color mapping utilities for bark textures.
 * Converts noise values to realistic bark colors.
 */

/**
 * Predefined color palettes for common tree species
 */
export const speciesPalettes: Record<string, ColorPalette> = {
  pine: {
    baseColor: [20, 45, 35],      // Reddish brown
    shadowColor: [15, 55, 20],    // Dark brown
    highlightColor: [25, 30, 50], // Lighter tan
    colorVariation: 8,
  },
  oak: {
    baseColor: [30, 35, 30],      // Gray-brown
    shadowColor: [25, 45, 15],    // Dark gray
    highlightColor: [35, 25, 45], // Lighter gray
    colorVariation: 5,
  },
  birch: {
    baseColor: [40, 8, 90],       // Near white
    shadowColor: [30, 20, 25],    // Dark marks
    highlightColor: [45, 5, 95],  // Bright white
    colorVariation: 3,
  },
  maple: {
    baseColor: [25, 30, 40],      // Medium gray
    shadowColor: [20, 40, 20],    // Dark gray-brown
    highlightColor: [30, 20, 55], // Lighter gray
    colorVariation: 6,
  },
  cherry: {
    baseColor: [10, 50, 35],      // Reddish brown
    shadowColor: [5, 60, 20],     // Dark red-brown
    highlightColor: [15, 35, 50], // Lighter copper
    colorVariation: 10,
  },
};

/**
 * Interpolate between two HSB colors
 *
 * @param color1 - First color [H, S, B]
 * @param color2 - Second color [H, S, B]
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated color
 */
export function lerpColor(
  color1: HSBColor,
  color2: HSBColor,
  t: number
): HSBColor {
  // Handle hue wrapping (e.g., 350 -> 10 should go through 0)
  let h1 = color1[0];
  let h2 = color2[0];

  // Take shortest path around color wheel
  if (Math.abs(h2 - h1) > 180) {
    if (h1 < h2) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }

  return [
    (h1 + (h2 - h1) * t) % 360,
    color1[1] + (color2[1] - color1[1]) * t,
    color1[2] + (color2[2] - color1[2]) * t,
  ];
}

/**
 * Map a noise value to a bark color using the palette
 *
 * @param _p - p5 instance (unused, kept for API consistency)
 * @param value - Noise value (0-1)
 * @param palette - Color palette to use
 * @param variation - Optional per-pixel variation (0-1)
 * @returns HSB color array
 */
export function mapToColor(
  _p: p5,
  value: number,
  palette: ColorPalette,
  variation: number = 0
): HSBColor {
  // Three-stop gradient: shadow -> base -> highlight
  let color: HSBColor;

  if (value < 0.5) {
    // Shadow to base
    const t = value * 2;
    color = lerpColor(palette.shadowColor, palette.baseColor, t);
  } else {
    // Base to highlight
    const t = (value - 0.5) * 2;
    color = lerpColor(palette.baseColor, palette.highlightColor, t);
  }

  // Add color variation (subtle hue shift)
  if (palette.colorVariation > 0 && variation > 0) {
    const hueShift = (variation - 0.5) * 2 * palette.colorVariation;
    color[0] = (color[0] + hueShift + 360) % 360;
  }

  return color;
}

/**
 * Apply HSB color to p5 context
 *
 * @param p - p5 instance
 * @param color - HSB color array
 * @param alpha - Optional alpha value (0-255)
 */
export function applyColor(
  p: p5,
  color: HSBColor,
  alpha: number = 255
): void {
  p.colorMode(p.HSB, 360, 100, 100, 255);
  p.fill(color[0], color[1], color[2], alpha);
  p.stroke(color[0], color[1], color[2], alpha);
}

/**
 * Convert HSB to RGB for pixel manipulation
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param b - Brightness (0-100)
 * @returns RGB array [r, g, b] (0-255 each)
 */
export function hsbToRgb(h: number, s: number, b: number): [number, number, number] {
  // Normalize inputs
  h = h / 360;
  s = s / 100;
  b = b / 100;

  let r: number, g: number, blue: number;

  if (s === 0) {
    r = g = blue = b;
  } else {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = b * (1 - s);
    const q = b * (1 - f * s);
    const t = b * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0: r = b; g = t; blue = p; break;
      case 1: r = q; g = b; blue = p; break;
      case 2: r = p; g = b; blue = t; break;
      case 3: r = p; g = q; blue = b; break;
      case 4: r = t; g = p; blue = b; break;
      case 5: r = b; g = p; blue = q; break;
      default: r = 0; g = 0; blue = 0;
    }
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(blue * 255),
  ];
}

/**
 * Get color for pixel array manipulation
 * Returns RGBA values ready for pixels[] array
 *
 * @param p - p5 instance
 * @param value - Noise value (0-1)
 * @param palette - Color palette
 * @param variation - Optional per-pixel variation
 * @returns RGBA array [r, g, b, a]
 */
export function getPixelColor(
  p: p5,
  value: number,
  palette: ColorPalette,
  variation: number = 0
): [number, number, number, number] {
  const hsb = mapToColor(p, value, palette, variation);
  const rgb = hsbToRgb(hsb[0], hsb[1], hsb[2]);
  return [rgb[0], rgb[1], rgb[2], 255];
}

/**
 * Create a color palette by interpolating between two species
 *
 * @param palette1 - First species palette
 * @param palette2 - Second species palette
 * @param t - Interpolation factor (0-1)
 * @returns Blended palette
 */
export function blendPalettes(
  palette1: ColorPalette,
  palette2: ColorPalette,
  t: number
): ColorPalette {
  return {
    baseColor: lerpColor(palette1.baseColor, palette2.baseColor, t),
    shadowColor: lerpColor(palette1.shadowColor, palette2.shadowColor, t),
    highlightColor: lerpColor(palette1.highlightColor, palette2.highlightColor, t),
    colorVariation: palette1.colorVariation + (palette2.colorVariation - palette1.colorVariation) * t,
  };
}
