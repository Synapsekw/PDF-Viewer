export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface HeatmapDataPoint {
  x: number;
  y: number;
  intensity: number;
}

export interface HeatmapGridCell {
  x: number;
  y: number;
  count: number;
  intensity: number;
}

export interface HeatmapConfig {
  gridSize: number;
  maxIntensity: number;
  fadeTime: number; // Time in ms after which data points start to fade
  opacity: number;
  radius: number; // Influence radius of each mouse position
}

export interface PageHeatmapData {
  pageNumber: number;
  positions: MousePosition[];
  grid: HeatmapGridCell[][];
  lastUpdate: number;
}