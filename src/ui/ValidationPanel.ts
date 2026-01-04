import type { ClassificationResult, ValidationResult, FeatureVector } from '@/types';
import { featureDescriptions } from '@/validation';

/**
 * UI component for displaying validation results
 */
export class ValidationPanel {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) {
      throw new Error(`Container not found: ${containerId}`);
    }
    this.container = el;
  }

  /**
   * Display classification results
   */
  showClassification(result: ClassificationResult): void {
    const html = `
      <div class="validation-result">
        <div class="species">${this.capitalize(result.primary.species)}</div>
        <div class="confidence">${(result.primary.confidence * 100).toFixed(1)}% confidence</div>
      </div>
      ${result.alternatives.length > 0 ? `
        <div class="alternatives">
          <div class="alt-header">Alternatives:</div>
          ${result.alternatives.slice(0, 3).map(alt => `
            <div class="alt-item">
              ${this.capitalize(alt.species)}: ${(alt.confidence * 100).toFixed(1)}%
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${result.mismatches.length > 0 ? `
        <div class="mismatches">
          <div class="mismatch-header">Feature mismatches:</div>
          ${result.mismatches.map(m => `
            <div class="mismatch-item" title="${featureDescriptions[m.feature] || m.feature}">
              ${m.feature}: ${m.actual.toFixed(2)} (expected ${m.expected[0].toFixed(2)}-${m.expected[1].toFixed(2)})
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    this.container.innerHTML = html;
    this.applyStyles();
  }

  /**
   * Display validation against specific species
   */
  showValidation(result: ValidationResult, targetSpecies: string): void {
    const statusClass = result.isValid ? 'valid' : 'invalid';
    const statusText = result.isValid ? 'VALID' : 'INVALID';

    const html = `
      <div class="validation-result ${statusClass}">
        <div class="target">Target: ${this.capitalize(targetSpecies)}</div>
        <div class="status">${statusText}</div>
        <div class="confidence">${(result.confidence * 100).toFixed(1)}% match</div>
      </div>
      <div class="feature-details">
        ${Object.entries(result.featureMatches).map(([key, match]) => `
          <div class="feature-row ${match.inRange ? 'match' : 'mismatch'}">
            <span class="feature-name" title="${featureDescriptions[key] || key}">${key}</span>
            <span class="feature-value">${match.value.toFixed(2)}</span>
            <span class="feature-range">[${match.expected[0].toFixed(2)}-${match.expected[1].toFixed(2)}]</span>
            <span class="feature-status">${match.inRange ? '✓' : '✗'}</span>
          </div>
        `).join('')}
      </div>
      ${result.suggestions.length > 0 ? `
        <div class="suggestions">
          <div class="suggestions-header">Suggestions:</div>
          ${result.suggestions.map(s => `<div class="suggestion-item">${s}</div>`).join('')}
        </div>
      ` : ''}
    `;

    this.container.innerHTML = html;
    this.applyStyles();
  }

  /**
   * Display raw feature values
   */
  showFeatures(features: FeatureVector): void {
    const html = `
      <div class="features">
        <div class="features-header">Extracted Features:</div>
        <div class="feature-row">
          <span class="feature-name">Vertical Energy</span>
          <span class="feature-value">${features.verticalEnergy.toFixed(3)}</span>
        </div>
        <div class="feature-row">
          <span class="feature-name">Horizontal Energy</span>
          <span class="feature-value">${features.horizontalEnergy.toFixed(3)}</span>
        </div>
        <div class="feature-row">
          <span class="feature-name">Ridge Density</span>
          <span class="feature-value">${features.ridgeDensity.toFixed(3)}</span>
        </div>
        <div class="feature-row">
          <span class="feature-name">Plate Size</span>
          <span class="feature-value">${features.plateSize.toFixed(3)}</span>
        </div>
        <div class="feature-row">
          <span class="feature-name">Color Variance</span>
          <span class="feature-value">${features.colorVariance.toFixed(3)}</span>
        </div>
        <div class="feature-row">
          <span class="feature-name">Mean Luminance</span>
          <span class="feature-value">${features.meanLuminance.toFixed(3)}</span>
        </div>
        <div class="feature-row">
          <span class="feature-name">Dominant Hue</span>
          <span class="feature-value">${features.dominantHue.toFixed(1)}°</span>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.applyStyles();
  }

  /**
   * Show loading state
   */
  showLoading(): void {
    this.container.innerHTML = '<p style="color: #888;">Analyzing texture...</p>';
  }

  /**
   * Show error
   */
  showError(message: string): void {
    this.container.innerHTML = `<p style="color: #ef4444;">${message}</p>`;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private applyStyles(): void {
    // Inject additional styles if not already present
    if (!document.getElementById('validation-panel-styles')) {
      const style = document.createElement('style');
      style.id = 'validation-panel-styles';
      style.textContent = `
        .validation-result.valid .status { color: #4ade80; }
        .validation-result.invalid .status { color: #ef4444; }
        .validation-result .status { font-weight: 600; font-size: 0.875rem; }
        .validation-result .target { font-size: 0.875rem; color: #888; margin-bottom: 0.25rem; }

        .feature-details { margin-top: 0.75rem; }
        .feature-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.25rem 0;
          font-size: 0.75rem;
          border-bottom: 1px solid #333;
        }
        .feature-row.match { color: #a3e635; }
        .feature-row.mismatch { color: #fbbf24; }
        .feature-name { flex: 1; }
        .feature-value { width: 50px; text-align: right; font-family: monospace; }
        .feature-range { width: 100px; text-align: right; color: #666; font-family: monospace; }
        .feature-status { width: 20px; text-align: center; }

        .alternatives { margin-top: 0.75rem; }
        .alt-header, .mismatch-header, .suggestions-header, .features-header {
          font-size: 0.75rem;
          color: #666;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .alt-item, .mismatch-item, .suggestion-item {
          font-size: 0.75rem;
          color: #888;
          padding: 0.125rem 0;
        }
        .mismatch-item { color: #fbbf24; }
        .suggestion-item { color: #60a5fa; }
      `;
      document.head.appendChild(style);
    }
  }
}
