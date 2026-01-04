# Architecture Documentation

This document provides detailed technical information about the Bark Generator's architecture, algorithms, and design decisions.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Parameter Panel │  │ Canvas Display  │  │Validation Panel │ │
│  │   (dat.GUI)     │  │    (p5.js)      │  │   (Custom)      │ │
│  └────────┬────────┘  └────────▲────────┘  └────────▲────────┘ │
│           │                    │                    │           │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    │                    │
┌───────────────────────────────────────────────────────────────┐
│                      Core Application                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    main.ts                                │ │
│  │  - Orchestrates components                                │ │
│  │  - Manages state                                          │ │
│  │  - Handles events                                         │ │
│  └─────────────────────┬────────────────────────────────────┘ │
│                        │                                       │
│  ┌─────────────────────┼─────────────────────────────────────┐│
│  │                     ▼                                      ││
│  │  ┌──────────────────────────────────────────────────────┐ ││
│  │  │              BarkGenerator                            │ ││
│  │  │  - Abstract base class                                │ ││
│  │  │  - Pixel-level texture generation                     │ ││
│  │  │  - Export functionality                               │ ││
│  │  └──────────────────┬───────────────────────────────────┘ ││
│  │                     │                                      ││
│  │    ┌────────────────┼───────────────────────────┐         ││
│  │    ▼                ▼                           ▼         ││
│  │ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        ││
│  │ │ Pine │  │ Oak  │  │Birch │  │Maple │  │Cherry│        ││
│  │ └──────┘  └──────┘  └──────┘  └──────┘  └──────┘        ││
│  │                                                           ││
│  │                   Generators Layer                        ││
│  └───────────────────────────────────────────────────────────┘│
│                                                                │
└────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌───────────────┐ ┌──────────────────┐
│   Algorithms      │ │   Validation  │ │       UI         │
│ ┌───────────────┐ │ │ ┌───────────┐ │ │ ┌──────────────┐ │
│ │ noise.ts      │ │ │ │ Feature   │ │ │ │ Parameter    │ │
│ │ - fBm         │ │ │ │ Extractor │ │ │ │ Panel        │ │
│ │ - ridgedNoise │ │ │ └─────┬─────┘ │ │ └──────────────┘ │
│ │ - domainWarp  │ │ │       │       │ │ ┌──────────────┐ │
│ └───────────────┘ │ │       ▼       │ │ │ Validation   │ │
│ ┌───────────────┐ │ │ ┌───────────┐ │ │ │ Panel        │ │
│ │ voronoi.ts    │ │ │ │ Species   │ │ │ └──────────────┘ │
│ │ - cellular    │ │ │ │Classifier │ │ │                  │
│ │ - edges       │ │ │ └───────────┘ │ │                  │
│ └───────────────┘ │ │               │ │                  │
│ ┌───────────────┐ │ │               │ │                  │
│ │ colorMap.ts   │ │ │               │ │                  │
│ │ - palettes    │ │ │               │ │                  │
│ │ - HSB→RGB     │ │ │               │ │                  │
│ └───────────────┘ │ │               │ │                  │
└───────────────────┘ └───────────────┘ └──────────────────┘
```

## Data Flow

### Generation Pipeline

1. **Parameter Input** → User adjusts sliders in dat.GUI
2. **Generator Selection** → Factory creates appropriate species generator
3. **Coordinate Transform** → Apply directional bias and domain warping
4. **Noise Computation** → Layer fBm, ridged noise, Voronoi
5. **Color Mapping** → Convert noise value to species-appropriate color
6. **Pixel Output** → Write to p5.Graphics buffer
7. **Validation** → Extract features and classify species

```
User Input → Params → Generator.generate() → pixels[] → Display
                                                    ↓
                                            FeatureExtractor
                                                    ↓
                                            SpeciesClassifier
                                                    ↓
                                            ValidationPanel
```

## Algorithm Details

### Noise Composition

The bark texture is composed of several noise layers:

```typescript
// Simplified algorithm flow
function calculateBarkValue(x, y) {
  // 1. Apply directional bias (stretch coordinates)
  [bx, by] = applyDirectionalBias(x, y, verticalBias, horizontalBias)

  // 2. Domain warp (organic distortion)
  [wx, wy] = domainWarp(bx, by, warpStrength, warpIterations)

  // 3. Base texture (fBm)
  base = fbm(wx, wy, octaves, lacunarity, persistence)

  // 4. Ridge noise (fissures)
  ridges = ridgedNoise(wx, wy, ...)

  // 5. Cellular pattern (plates)
  voronoi = voronoiBark(wx, wy, cellDensity)
  edges = voronoiEdges(wx, wy, edgeWidth)

  // 6. Combine layers
  value = mix(base, ridges, ridgeIntensity)
  value = mix(value, voronoi, 0.3)
  value = value * (1 - edges * 0.5)  // Darken cracks

  // 7. Apply contrast
  return applyContrast(value, contrast)
}
```

### Fractal Brownian Motion (fBm)

```
fBm(x, y) = Σᵢ (persistenceⁱ × noise(lacunarityⁱ × x, lacunarityⁱ × y))
```

- **Octaves**: Number of noise layers (more = more detail)
- **Lacunarity**: Frequency multiplier between octaves (typically 2.0)
- **Persistence**: Amplitude multiplier between octaves (typically 0.5)

### Ridged Multifractal

Creates sharp ridges by inverting absolute value of noise:

```
ridge(n) = 1 - |2n - 1|
ridgedNoise = Σᵢ amplitudeⁱ × ridge(noise(...))²
```

### Voronoi/Worley Noise

For each point, find distances to nearest cell seeds:
- **F1**: Distance to nearest seed → cell interior shading
- **F2**: Distance to second nearest → used for edges
- **F2 - F1**: Edge detection (small = on boundary)

## Species Differentiation

Each species has distinct parameter profiles:

| Parameter | Pine | Oak | Birch | Maple | Cherry |
|-----------|------|-----|-------|-------|--------|
| Vertical Bias | High | Medium | Low | Medium | Low |
| Horizontal Bias | Low | Medium | High | Low | Medium |
| Ridge Intensity | Medium | High | Low | Medium | Low |
| Voronoi Cell Size | Medium | Large | — | Medium | — |
| Color | Red-brown | Gray-brown | White | Gray | Copper |

## Validation System

### Feature Extraction

The FeatureExtractor analyzes the generated texture:

1. **Directional Energy**: Sobel-like gradient analysis
   - Sum of |horizontal gradients| → vertical features
   - Sum of |vertical gradients| → horizontal features

2. **Ridge Density**: Edge magnitude average
   - Higher = rougher bark

3. **Plate Size**: Run-length analysis
   - Consecutive similar-value pixels → plate regions

4. **Color Statistics**: Luminance variance and mean

### Classification

Rule-based matching against species profiles:

```typescript
// For each species
for (feature in speciesRanges) {
  if (extractedValue >= range.min && extractedValue <= range.max) {
    score += 1.0  // Full match
  } else {
    score += partialScore(distance)  // Partial based on how close
  }
}
confidence = score / totalFeatures
```

## Extension Points

### Adding New Species

1. Create `src/generators/NewSpeciesBark.ts`
2. Extend `BarkGenerator`
3. Define `createDefaultParams()` with species characteristics
4. Override `calculateBarkValue()` if needed
5. Add to `speciesRegistry` in `generators/index.ts`
6. Define feature ranges in `validation/features.ts`

### Adding New Algorithms

1. Add function to appropriate file in `src/algorithms/`
2. Export from `algorithms/index.ts`
3. Use in generator's `calculateBarkValue()` method

### Future: ML Classifier Integration

```typescript
// Planned interface
class MLClassifier implements Classifier {
  private model: tf.GraphModel;

  async load(modelPath: string): Promise<void>;
  classify(texture: RenderTarget): Promise<ClassificationResult>;
}
```

Model requirements:
- Input: 224×224 RGB image tensor
- Output: Probability distribution over species
- Format: TensorFlow.js or ONNX

## Performance Considerations

### Current Implementation
- Pixel-by-pixel generation in JavaScript
- ~500ms for 512×512 texture
- Acceptable for real-time preview

### Optimization Opportunities
1. **Web Workers**: Offload generation to background thread
2. **WASM**: Port noise functions to Rust/C++
3. **WebGL Shaders**: GPU-accelerated generation
4. **Caching**: Memoize noise values for unchanged regions

## File Organization

```
src/
├── main.ts              # Entry point, app orchestration
├── types/
│   └── index.ts         # Shared TypeScript interfaces
├── algorithms/
│   ├── index.ts         # Barrel export
│   ├── noise.ts         # fBm, ridged, warp, turbulence
│   ├── voronoi.ts       # Cellular patterns
│   └── colorMap.ts      # Color palettes and mapping
├── generators/
│   ├── index.ts         # Factory and registry
│   ├── BarkGenerator.ts # Abstract base class
│   ├── PineBark.ts
│   ├── OakBark.ts
│   ├── BirchBark.ts
│   ├── MapleBark.ts
│   └── CherryBark.ts
├── validation/
│   ├── index.ts
│   ├── features.ts      # Species feature definitions
│   ├── FeatureExtractor.ts
│   └── SpeciesClassifier.ts
└── ui/
    ├── index.ts
    ├── ParameterPanel.ts
    └── ValidationPanel.ts
```
