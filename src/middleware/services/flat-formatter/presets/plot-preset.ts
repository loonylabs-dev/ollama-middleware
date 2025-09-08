import { BasePreset } from './base-preset';
import { Plot } from './types/entity-types';
import { ProcessedPlot } from './types/processed-entity-types';

export class PlotPreset extends BasePreset<Plot, ProcessedPlot> {
  constructor() {
    super('Plot');
  }

  protected preprocessEntity(plot: Plot): ProcessedPlot {
    return {
      'Title': plot.Title || 'Untitled Plot',
      'Main Conflict': plot.MainConflict || 'No main conflict specified',
      'Plot Structure': plot.PlotStructure || 'No plot structure specified',
      'Key Events': plot.KeyEvents || 'No key events specified',
      'Climax': plot.Climax || 'No climax specified',
      'Resolution': plot.Resolution || 'No resolution specified',
      'Sub Plots': plot.SubPlots || 'No sub plots specified',
      'Plot Twists': plot.PlotTwists || 'No plot twists specified',
      'Themes': plot.Themes || 'No themes specified',
      'Pacing': plot.Pacing || 'No pacing specified',
      'Tension Curve': plot.TensionCurve || 'No tension curve specified'
    };
  }
}

// Singleton instance for global use
export const plotPreset = new PlotPreset();