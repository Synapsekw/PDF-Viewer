/**
 * Plugin configuration and loading system.
 * 
 * This file defines the available plugins and their configurations.
 * To add a new plugin, import it and add it to the AVAILABLE_PLUGINS array.
 */

import { PdfFeatureComponent } from '../pdf/types';
import { MouseHeatmap } from '../features/analytics/MouseHeatmap';
import { AnalyticsOverlay } from '../features/analytics/AnalyticsOverlay';
import { PerformanceMonitor } from '../features/analytics/PerformanceMonitor';

/**
 * Configuration for a PDF viewer plugin.
 */
export interface PluginConfig {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name for the plugin */
  name: string;
  /** Brief description of what the plugin does */
  description: string;
  /** Whether the plugin is enabled by default */
  enabled: boolean;
  /** Plugin priority for loading order (higher = later) */
  priority: number;
  /** The actual feature component */
  component: PdfFeatureComponent;
  /** Plugin-specific configuration */
  config?: Record<string, any>;
}

/**
 * Available plugins in the PDF viewer.
 * Add new plugins to this array to make them available for loading.
 */
export const AVAILABLE_PLUGINS: PluginConfig[] = [
  {
    id: 'mouse-heatmap',
    name: 'Mouse Heatmap',
    description: 'Tracks mouse movements and displays a heatmap overlay',
    enabled: true,
    priority: 1,
    component: MouseHeatmap,
    config: {
      gridSize: 20,
      maxIntensity: 100,
      fadeTime: 30000,
      opacity: 0.6,
      radius: 30,
    },
  },
  {
    id: 'analytics-overlay',
    name: 'Analytics Overlay',
    description: 'Displays analytics information as an overlay',
    enabled: true,
    priority: 2,
    component: AnalyticsOverlay,
    config: {
      position: 'top-right',
      showSessionInfo: true,
    },
  },
  {
    id: 'performance-monitor',
    name: 'Performance Monitor',
    description: 'Real-time performance monitoring and storage usage (Ctrl+Shift+P)',
    enabled: false, // Disabled by default - enable manually for performance monitoring
    priority: 10,
    component: PerformanceMonitor,
    config: {
      enabledInProduction: false,
      keyboardShortcut: 'Ctrl+Shift+P',
    },
  },
];

/**
 * Filter and sort plugins based on their configuration.
 * 
 * @param {PluginConfig[]} plugins - Array of plugin configurations
 * @param {boolean} enabledOnly - Whether to only return enabled plugins
 * @returns {PluginConfig[]} Filtered and sorted plugins
 */
export const getPlugins = (
  plugins: PluginConfig[] = AVAILABLE_PLUGINS,
  enabledOnly: boolean = true
): PluginConfig[] => {
  return plugins
    .filter(plugin => !enabledOnly || plugin.enabled)
    .sort((a, b) => a.priority - b.priority);
};

/**
 * Get a specific plugin by its ID.
 * 
 * @param {string} id - Plugin ID
 * @returns {PluginConfig | undefined} Plugin configuration or undefined
 */
export const getPlugin = (id: string): PluginConfig | undefined => {
  return AVAILABLE_PLUGINS.find(plugin => plugin.id === id);
};

/**
 * Enable or disable a plugin.
 * 
 * @param {string} id - Plugin ID
 * @param {boolean} enabled - Whether to enable the plugin
 * @returns {boolean} True if plugin was found and updated
 */
export const setPluginEnabled = (id: string, enabled: boolean): boolean => {
  const plugin = getPlugin(id);
  if (plugin) {
    plugin.enabled = enabled;
    return true;
  }
  return false;
};

export default AVAILABLE_PLUGINS;