import p5 from 'p5';
import type { BarkParams } from '@/types';
import { createGenerator, getSpeciesDefaults, BarkGenerator } from '@/generators';
import { SpeciesClassifier } from '@/validation';
import { ParameterPanel, ValidationPanel } from '@/ui';

/**
 * Main application entry point
 */

// Application state
let generator: BarkGenerator | null = null;
let classifier: SpeciesClassifier | null = null;
let _paramPanel: ParameterPanel | null = null;
let validationPanel: ValidationPanel | null = null;
let currentParams: BarkParams = getSpeciesDefaults('pine');
let isGenerating = false;

// UI elements
let generateBtn: HTMLButtonElement | null = null;
let progressBar: HTMLDivElement | null = null;
let progressFill: HTMLDivElement | null = null;
let progressText: HTMLSpanElement | null = null;

// Canvas dimensions
const CANVAS_SIZE = 512;

/**
 * p5.js sketch definition (instance mode)
 */
const sketch = (p: p5) => {
  p.setup = () => {
    // Create canvas in container
    const container = document.getElementById('canvas-container');
    if (!container) {
      console.error('Canvas container not found');
      return;
    }

    const canvas = p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.parent(container);

    // Set pixel density for crisp rendering
    p.pixelDensity(1);

    // Initialize classifier
    classifier = new SpeciesClassifier(p);

    // Initialize generator with default species
    generator = createGenerator(p, currentParams.species, currentParams);

    // Initialize UI
    initializeUI(p);

    // Show placeholder until user generates
    p.background(30);
    p.fill(100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('Click "Generate" to create bark texture', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  };

  p.draw = () => {
    // Display the generated texture
    if (generator) {
      const graphics = generator.getGraphics();
      if (graphics) {
        p.image(graphics, 0, 0);
      }
    }

    // Only draw once per generation (no animation needed)
    p.noLoop();
  };
};

/**
 * Initialize UI components
 */
function initializeUI(p: p5) {
  // Parameter panel - no longer auto-regenerates
  const guiContainer = document.getElementById('gui-container');
  if (guiContainer) {
    _paramPanel = new ParameterPanel(guiContainer, currentParams, (newParams) => {
      currentParams = newParams;

      // Check if species changed
      if (generator && generator.species !== newParams.species) {
        generator = createGenerator(p, newParams.species, newParams);
      } else if (generator) {
        generator.setParams(newParams);
      }

      // Don't auto-regenerate - wait for user to click Generate
    });
  }

  // Validation panel
  validationPanel = new ValidationPanel('validation-results');

  // Add generate button and progress bar
  addGenerateButton(p);

  // Export button
  addExportButton();
}

/**
 * Add generate button and progress bar to the UI
 */
function addGenerateButton(p: p5) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const container = document.createElement('div');
  container.style.cssText = 'padding: 1rem; border-top: 1px solid #333;';

  // Generate button
  generateBtn = document.createElement('button');
  generateBtn.textContent = 'Generate';
  generateBtn.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    font-size: 1rem;
  `;
  generateBtn.addEventListener('click', () => startGeneration(p));

  // Progress bar container
  progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width: 100%;
    height: 24px;
    background: #1a1a1a;
    border-radius: 4px;
    margin-top: 0.75rem;
    overflow: hidden;
    display: none;
    position: relative;
  `;

  // Progress fill
  progressFill = document.createElement('div');
  progressFill.style.cssText = `
    width: 0%;
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
    transition: width 0.1s ease-out;
  `;

  // Progress text
  progressText = document.createElement('span');
  progressText.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 500;
  `;
  progressText.textContent = '0%';

  progressBar.appendChild(progressFill);
  progressBar.appendChild(progressText);

  container.appendChild(generateBtn);
  container.appendChild(progressBar);

  // Insert at top of sidebar (after gui-container)
  const guiContainer = document.getElementById('gui-container');
  if (guiContainer && guiContainer.nextSibling) {
    sidebar.insertBefore(container, guiContainer.nextSibling);
  } else {
    sidebar.appendChild(container);
  }
}

/**
 * Add export button to the UI
 */
function addExportButton() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const exportContainer = document.createElement('div');
  exportContainer.style.cssText = 'padding: 1rem; border-top: 1px solid #333;';

  const exportBtn = document.createElement('button');
  exportBtn.textContent = 'Export PNG';
  exportBtn.style.cssText = `
    width: 100%;
    padding: 0.75rem;
    background: #4ade80;
    color: #000;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  `;
  exportBtn.addEventListener('click', exportTexture);

  exportContainer.appendChild(exportBtn);
  sidebar.appendChild(exportContainer);
}

/**
 * Update progress bar
 */
function updateProgress(percent: number, status?: string) {
  if (progressFill) {
    progressFill.style.width = `${percent}%`;
  }
  if (progressText) {
    progressText.textContent = status || `${Math.round(percent)}%`;
  }
}

/**
 * Start texture generation with progress updates
 */
async function startGeneration(_p: p5) {
  if (!generator || isGenerating) return;

  isGenerating = true;

  // Update UI
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.5';
    generateBtn.style.cursor = 'not-allowed';
  }
  if (progressBar) {
    progressBar.style.display = 'block';
  }

  try {
    // Use async generation with progress callback
    await generator.generateAsync(CANVAS_SIZE, CANVAS_SIZE, (percent, status) => {
      updateProgress(percent, status);

      // Update canvas display during generation
      const p5Instance = (window as unknown as { _p5Instance?: p5 })._p5Instance;
      if (p5Instance) {
        p5Instance.loop();
      }
    });

    // Generation complete
    finishGeneration();
  } catch (error) {
    console.error('Generation failed:', error);
    isGenerating = false;
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.style.opacity = '1';
      generateBtn.style.cursor = 'pointer';
    }
    if (progressBar) {
      progressBar.style.display = 'none';
    }
  }
}

/**
 * Complete the generation process
 */
function finishGeneration() {
  isGenerating = false;

  // Update UI
  if (generateBtn) {
    generateBtn.disabled = false;
    generateBtn.style.opacity = '1';
    generateBtn.style.cursor = 'pointer';
  }

  // Hide progress bar after a moment
  setTimeout(() => {
    if (progressBar) {
      progressBar.style.display = 'none';
    }
    updateProgress(0);
  }, 1000);

  // Trigger final redraw
  const p5Instance = (window as unknown as { _p5Instance?: p5 })._p5Instance;
  if (p5Instance) {
    p5Instance.loop();
  }

  // Run validation
  runValidation();
}

/**
 * Run species validation on current texture
 */
function runValidation() {
  if (!generator || !classifier || !validationPanel) return;

  const graphics = generator.getGraphics();
  if (!graphics) return;

  validationPanel.showLoading();

  // Use setTimeout to not block rendering
  setTimeout(() => {
    try {
      const result = classifier!.classify(graphics);
      validationPanel!.showClassification(result);
    } catch (error) {
      console.error('Validation error:', error);
      validationPanel!.showError('Failed to analyze texture');
    }
  }, 50);
}

/**
 * Export current texture as PNG
 */
async function exportTexture() {
  if (!generator) return;

  try {
    const blob = await generator.export();
    const metadata = generator.getExportMetadata();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bark-${metadata.species}-${Date.now()}.png`;
    link.click();

    // Also log metadata (could embed in PNG with future enhancement)
    console.log('Export metadata:', metadata);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export texture');
  }
}

// Initialize p5.js in instance mode
const p5Instance = new p5(sketch);

// Store reference for regeneration
(window as unknown as { _p5Instance?: p5 })._p5Instance = p5Instance;

// Log welcome message
console.log(`
╔════════════════════════════════════════╗
║          BARK GENERATOR v0.1           ║
╠════════════════════════════════════════╣
║  Procedural tree bark texture tool     ║
║  Built with p5.js + TypeScript         ║
╚════════════════════════════════════════╝
`);
