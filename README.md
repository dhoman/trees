# Tree Bark Generator

A procedural tree bark texture generator built with p5.js. Generate realistic 2D bark patterns for various tree species using tunable algorithms inspired by "The Nature of Code" principles.

## Overview

This application generates procedural bark textures that mimic real tree species. Each species has distinct bark characteristics—pine's scaly plates, oak's deep ridges, birch's horizontal lenticels—captured through composable algorithmic primitives.

### Key Features

- **Species-specific generation**: Tuned presets for pine, oak, birch, maple, and more
- **Real-time parameter adjustment**: Interactive sliders for all generation parameters
- **Rule-based validation**: Verify generated textures match species characteristics
- **Export capabilities**: Save textures as PNG with embedded metadata

## Tech Stack

- **p5.js** - Creative coding framework with built-in Perlin noise
- **Vite** - Fast build tool with hot module replacement
- **TypeScript** - Type safety for complex parameter structures
- **dat.GUI** - Lightweight UI for parameter controls

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
trees/
├── src/
│   ├── main.ts                 # Entry point, p5.js sketch setup
│   ├── generators/
│   │   ├── BarkGenerator.ts    # Abstract base class
│   │   ├── PineBark.ts         # Scaly, vertically fissured
│   │   ├── OakBark.ts          # Deep ridges, rough texture
│   │   ├── BirchBark.ts        # Horizontal bands, peeling
│   │   ├── MapleBark.ts        # Plated with fissures
│   │   └── index.ts            # Species registry
│   ├── algorithms/
│   │   ├── noise.ts            # Extended noise utilities (fBm, ridged)
│   │   ├── voronoi.ts          # Cellular/Worley noise
│   │   ├── domainWarp.ts       # Warping functions
│   │   └── colorMap.ts         # Bark color palettes
│   ├── validation/
│   │   ├── FeatureExtractor.ts # Analyze generated textures
│   │   ├── SpeciesClassifier.ts# Rule-based species matching
│   │   └── features.ts         # Species feature definitions
│   ├── ui/
│   │   ├── ParameterPanel.ts   # dat.GUI wrapper
│   │   └── ExportPanel.ts      # Save/export controls
│   └── types/
│       └── index.ts            # Shared type definitions
├── public/
│   └── index.html
├── models/                     # Future: ML classifier weights
│   └── .gitkeep
└── docs/
    └── ARCHITECTURE.md         # Detailed technical documentation
```

---

## Architecture

### Core Algorithms

The generator combines several noise-based algorithms, each contributing different aspects of bark appearance:

#### 1. Fractal Brownian Motion (fBm)

Layers multiple octaves of Perlin noise to create self-similar detail at multiple scales. Controls overall texture complexity.

```
fBm(x, y) = Σ (amplitude^i * noise(frequency^i * x, frequency^i * y))
```

**Parameters:**
- `octaves` (1-8): Number of noise layers
- `lacunarity` (1.5-3.0): Frequency multiplier per octave
- `persistence` (0.3-0.7): Amplitude decay per octave

#### 2. Domain Warping

Feeds noise output back as input coordinates, creating organic distortions that mimic natural growth patterns.

```
warp(x, y) = noise(x + noise(x, y), y + noise(x, y))
```

**Parameters:**
- `warpStrength` (0-2): Intensity of coordinate displacement
- `warpIterations` (1-3): Recursive warping passes

#### 3. Voronoi/Worley Noise

Generates cellular patterns for bark plates and scales. Distance to nearest seed points creates natural-looking boundaries.

**Parameters:**
- `cellDensity` (0.01-0.1): Seed point frequency
- `distanceFunction`: Euclidean, Manhattan, or Chebyshev
- `edgeWidth` (0-0.3): Fissure/crack width between cells

#### 4. Directional Bias

Applies anisotropic scaling to create vertical fissures (pine) or horizontal lenticels (birch).

**Parameters:**
- `verticalBias` (0-1): Stretch factor in Y direction
- `horizontalBias` (0-1): Stretch factor in X direction

### Species Parameter Profiles

Each species is defined by a preset combination of the above parameters:

| Species | Primary Algorithm | Key Characteristics |
|---------|------------------|---------------------|
| **Pine** | fBm + vertical bias | Scaly plates, deep vertical fissures, reddish-brown |
| **Oak** | Ridged noise + Voronoi | Deep irregular ridges, rough, dark gray-brown |
| **Birch** | Horizontal stripes + alpha masks | Papery, peeling, white with dark lenticels |
| **Maple** | Voronoi + crack overlay | Plated appearance, vertical fissures, gray |
| **Cherry** | Smooth gradient + horizontal bands | Glossy, horizontal lenticels, reddish |

### Color System

Bark colors are generated using multi-stop gradients mapped to noise values:

```typescript
interface ColorPalette {
  baseColor: [number, number, number];      // HSB
  shadowColor: [number, number, number];
  highlightColor: [number, number, number];
  colorVariation: number;                   // Random hue shift range
}
```

---

## Validation System

### Rule-Based Feature Extraction

The validator analyzes generated textures to determine species likelihood:

#### Extracted Features

1. **Frequency Analysis** (FFT-based)
   - Dominant frequencies indicate scale of features
   - Vertical vs horizontal energy distribution

2. **Edge Detection**
   - Ridge density and orientation
   - Fissure depth estimation via gradient magnitude

3. **Cell Analysis**
   - Plate size distribution
   - Regularity of cellular patterns

4. **Color Statistics**
   - Mean, variance of luminance
   - Hue distribution

#### Species Matching

Each species defines acceptable ranges for extracted features:

```typescript
interface SpeciesFeatureRanges {
  species: string;
  features: {
    verticalEnergy: [min: number, max: number];
    horizontalEnergy: [min: number, max: number];
    ridgeDensity: [min: number, max: number];
    plateSize: [min: number, max: number];
    colorVariance: [min: number, max: number];
  };
  confidence: number;  // Required match percentage
}
```

The classifier scores the generated texture against each species profile and returns:
- Primary species match with confidence percentage
- Secondary matches if ambiguous
- Specific feature mismatches for tuning guidance

---

## Roadmap

### Phase 1: Core Generator (Current)
- [x] Project setup with Vite + TypeScript + p5.js
- [ ] Implement base noise algorithms (fBm, domain warp)
- [ ] Implement Voronoi/Worley noise
- [ ] Create abstract `BarkGenerator` class
- [ ] Build parameter UI with dat.GUI
- [ ] PNG export with metadata

### Phase 2: Species Presets
- [ ] Pine bark generator
- [ ] Oak bark generator
- [ ] Birch bark generator
- [ ] Maple bark generator
- [ ] Cherry bark generator
- [ ] Preset save/load system
- [ ] Parameter interpolation ("breeding" between species)

### Phase 3: Validation System
- [ ] Feature extraction pipeline
- [ ] FFT-based frequency analysis
- [ ] Edge detection for ridge analysis
- [ ] Rule-based species classifier
- [ ] Validation UI with feedback
- [ ] Auto-tuning suggestions

### Phase 4: Enhanced Generation
- [ ] Seamless tiling option
- [ ] Resolution independence
- [ ] Batch generation
- [ ] Animation/growth simulation
- [ ] Additional species (eucalyptus, redwood, etc.)

### Phase 5: ML Classifier (Future)

> **Note**: This phase is planned for future implementation to provide more robust species validation beyond rule-based matching.

#### Approach

1. **Dataset Collection**
   - Source: iNaturalist bark images (CC-licensed)
   - Target: 500+ images per species, 10+ species
   - Preprocessing: Crop to square, normalize lighting

2. **Model Architecture**
   - Base: MobileNetV3 or EfficientNet-Lite (small footprint)
   - Transfer learning from ImageNet weights
   - Fine-tune on bark classification task
   - Output: Species probability distribution

3. **Integration**
   - Convert trained model to TensorFlow.js or ONNX
   - Load model in browser (~5-10MB)
   - Classify generated textures in real-time
   - Provide confidence scores and feature attribution

4. **Training Pipeline**
   ```
   Raw Images → Augmentation → Training → Export → Browser Runtime
   ```

5. **Validation Metrics**
   - Per-species precision/recall
   - Confusion matrix for similar species
   - Calibration of confidence scores

#### Alternative: Perceptual Hashing

If ML proves too heavy, a lighter approach:
- Build perceptual hash database from reference images
- Compare generated textures via hamming distance
- Cluster-based species matching

---

## API Reference

### BarkGenerator (Abstract)

```typescript
abstract class BarkGenerator {
  constructor(params: BarkParams);

  // Generate texture to p5.Graphics buffer
  abstract generate(width: number, height: number): p5.Graphics;

  // Get current parameters
  getParams(): BarkParams;

  // Update parameters (triggers regeneration)
  setParams(params: Partial<BarkParams>): void;

  // Export as PNG blob
  export(): Promise<Blob>;
}
```

### SpeciesClassifier

```typescript
class SpeciesClassifier {
  // Analyze texture and return species matches
  classify(texture: p5.Graphics): ClassificationResult;

  // Get detailed feature breakdown
  extractFeatures(texture: p5.Graphics): FeatureVector;

  // Check if texture matches specific species
  validate(texture: p5.Graphics, species: string): ValidationResult;
}
```

---

## References

- Shiffman, D. (2012). *The Nature of Code*. https://natureofcode.com/
- Perlin, K. (1985). "An Image Synthesizer". SIGGRAPH '85.
- Worley, S. (1996). "A Cellular Texture Basis Function". SIGGRAPH '96.
- Lagae, A. et al. (2010). "A Survey of Procedural Noise Functions". Computer Graphics Forum.

---

## License

MIT
