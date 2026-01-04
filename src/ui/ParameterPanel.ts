import * as dat from 'dat.gui';
import type { BarkParams } from '@/types';
import { availableSpecies, getSpeciesDefaults } from '@/generators';

/**
 * Parameter control panel using dat.GUI
 */
export class ParameterPanel {
  private gui: dat.GUI;
  private params: BarkParams;
  private onChange: (params: BarkParams) => void;
  private folders: Record<string, dat.GUI> = {};

  constructor(
    container: HTMLElement,
    initialParams: BarkParams,
    onChange: (params: BarkParams) => void
  ) {
    this.params = { ...initialParams };
    this.onChange = onChange;

    this.gui = new dat.GUI({ autoPlace: false });
    container.appendChild(this.gui.domElement);

    this.buildUI();
  }

  private buildUI(): void {
    // Species selector
    const speciesController = this.gui.add(
      { species: this.params.species },
      'species',
      availableSpecies
    );
    speciesController.name('Species');
    speciesController.onChange((value: string) => {
      // Load species defaults
      const defaults = getSpeciesDefaults(value);
      this.updateParams(defaults);
      this.rebuildFolders();
    });

    // Seed (regenerate)
    this.gui.add(this.params.noise, 'seed', 0, 99999, 1)
      .name('Seed')
      .onChange(() => this.notifyChange());

    // Add regenerate button
    this.gui.add({ regenerate: () => {
      this.params.noise.seed = Math.floor(Math.random() * 100000);
      this.notifyChange();
      this.rebuildFolders();
    }}, 'regenerate').name('Randomize');

    // Build parameter folders
    this.buildNoiseFolders();
    this.buildWarpFolder();
    this.buildVoronoiFolder();
    this.buildDirectionFolder();
    this.buildColorFolder();
    this.buildOutputFolder();
  }

  private buildNoiseFolders(): void {
    const folder = this.gui.addFolder('Noise');
    this.folders.noise = folder;

    folder.add(this.params.noise, 'scale', 0.001, 0.1, 0.001)
      .name('Scale')
      .onChange(() => this.notifyChange());

    folder.add(this.params.noise, 'octaves', 1, 8, 1)
      .name('Octaves')
      .onChange(() => this.notifyChange());

    folder.add(this.params.noise, 'lacunarity', 1.5, 3.0, 0.1)
      .name('Lacunarity')
      .onChange(() => this.notifyChange());

    folder.add(this.params.noise, 'persistence', 0.2, 0.8, 0.05)
      .name('Persistence')
      .onChange(() => this.notifyChange());

    folder.add(this.params, 'ridgeIntensity', 0, 1, 0.05)
      .name('Ridge Intensity')
      .onChange(() => this.notifyChange());

    folder.add(this.params, 'contrast', 0.5, 2.0, 0.1)
      .name('Contrast')
      .onChange(() => this.notifyChange());

    folder.open();
  }

  private buildWarpFolder(): void {
    const folder = this.gui.addFolder('Domain Warp');
    this.folders.warp = folder;

    folder.add(this.params.warp, 'strength', 0, 2, 0.1)
      .name('Strength')
      .onChange(() => this.notifyChange());

    folder.add(this.params.warp, 'iterations', 1, 3, 1)
      .name('Iterations')
      .onChange(() => this.notifyChange());

    folder.add(this.params.warp, 'scale', 0.001, 0.05, 0.001)
      .name('Scale')
      .onChange(() => this.notifyChange());
  }

  private buildVoronoiFolder(): void {
    const folder = this.gui.addFolder('Cellular (Voronoi)');
    this.folders.voronoi = folder;

    folder.add(this.params.voronoi, 'cellDensity', 0.005, 0.1, 0.005)
      .name('Cell Density')
      .onChange(() => this.notifyChange());

    folder.add(this.params.voronoi, 'distanceFunction', ['euclidean', 'manhattan', 'chebyshev'])
      .name('Distance Func')
      .onChange(() => this.notifyChange());

    folder.add(this.params.voronoi, 'edgeWidth', 0, 0.4, 0.02)
      .name('Edge Width')
      .onChange(() => this.notifyChange());

    folder.add(this.params.voronoi, 'jitter', 0, 1, 0.1)
      .name('Jitter')
      .onChange(() => this.notifyChange());
  }

  private buildDirectionFolder(): void {
    const folder = this.gui.addFolder('Direction');
    this.folders.direction = folder;

    folder.add(this.params.direction, 'verticalBias', 0, 1, 0.05)
      .name('Vertical Bias')
      .onChange(() => this.notifyChange());

    folder.add(this.params.direction, 'horizontalBias', 0, 1, 0.05)
      .name('Horizontal Bias')
      .onChange(() => this.notifyChange());

    folder.add(this.params.direction, 'angle', -Math.PI, Math.PI, 0.1)
      .name('Angle')
      .onChange(() => this.notifyChange());
  }

  private buildColorFolder(): void {
    const folder = this.gui.addFolder('Colors');
    this.folders.colors = folder;

    // Base color HSB
    const baseFolder = folder.addFolder('Base Color');
    baseFolder.add(this.params.colors.baseColor, '0', 0, 360, 1)
      .name('Hue')
      .onChange(() => this.notifyChange());
    baseFolder.add(this.params.colors.baseColor, '1', 0, 100, 1)
      .name('Saturation')
      .onChange(() => this.notifyChange());
    baseFolder.add(this.params.colors.baseColor, '2', 0, 100, 1)
      .name('Brightness')
      .onChange(() => this.notifyChange());

    // Shadow color
    const shadowFolder = folder.addFolder('Shadow Color');
    shadowFolder.add(this.params.colors.shadowColor, '0', 0, 360, 1)
      .name('Hue')
      .onChange(() => this.notifyChange());
    shadowFolder.add(this.params.colors.shadowColor, '1', 0, 100, 1)
      .name('Saturation')
      .onChange(() => this.notifyChange());
    shadowFolder.add(this.params.colors.shadowColor, '2', 0, 100, 1)
      .name('Brightness')
      .onChange(() => this.notifyChange());

    // Highlight color
    const highlightFolder = folder.addFolder('Highlight Color');
    highlightFolder.add(this.params.colors.highlightColor, '0', 0, 360, 1)
      .name('Hue')
      .onChange(() => this.notifyChange());
    highlightFolder.add(this.params.colors.highlightColor, '1', 0, 100, 1)
      .name('Saturation')
      .onChange(() => this.notifyChange());
    highlightFolder.add(this.params.colors.highlightColor, '2', 0, 100, 1)
      .name('Brightness')
      .onChange(() => this.notifyChange());

    folder.add(this.params.colors, 'colorVariation', 0, 30, 1)
      .name('Color Variation')
      .onChange(() => this.notifyChange());
  }

  private buildOutputFolder(): void {
    const folder = this.gui.addFolder('Output');
    this.folders.output = folder;

    const outputSettings = {
      width: 512,
      height: 512,
    };

    folder.add(outputSettings, 'width', [256, 512, 1024, 2048])
      .name('Width');

    folder.add(outputSettings, 'height', [256, 512, 1024, 2048])
      .name('Height');

    folder.open();
  }

  private notifyChange(): void {
    this.onChange({ ...this.params });
  }

  private rebuildFolders(): void {
    // Remove and rebuild all folders with new values
    for (const key of Object.keys(this.folders)) {
      this.gui.removeFolder(this.folders[key]);
    }
    this.folders = {};

    this.buildNoiseFolders();
    this.buildWarpFolder();
    this.buildVoronoiFolder();
    this.buildDirectionFolder();
    this.buildColorFolder();
    this.buildOutputFolder();
  }

  /**
   * Update internal params (from external source)
   */
  updateParams(params: BarkParams): void {
    // Deep copy params
    this.params = JSON.parse(JSON.stringify(params));
  }

  /**
   * Get current params
   */
  getParams(): BarkParams {
    return { ...this.params };
  }

  /**
   * Destroy the GUI
   */
  destroy(): void {
    this.gui.destroy();
  }
}
