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
let paramPanel: ParameterPanel | null = null;
let validationPanel: ValidationPanel | null = null;
let currentParams: BarkParams = getSpeciesDefaults('pine');

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

    // Generate initial texture
    regenerateTexture();
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
  // Parameter panel
  const guiContainer = document.getElementById('gui-container');
  if (guiContainer) {
    paramPanel = new ParameterPanel(guiContainer, currentParams, (newParams) => {
      currentParams = newParams;

      // Check if species changed
      if (generator && generator.species !== newParams.species) {
        generator = createGenerator(p, newParams.species, newParams);
      } else if (generator) {
        generator.setParams(newParams);
      }

      regenerateTexture();
    });
  }

  // Validation panel
  validationPanel = new ValidationPanel('validation-results');

  // Export button (add to GUI container)
  addExportButton();
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
 * Regenerate the texture with current parameters
 */
function regenerateTexture() {
  if (!generator) return;

  // Generate texture
  generator.generate(CANVAS_SIZE, CANVAS_SIZE);

  // Trigger redraw
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
