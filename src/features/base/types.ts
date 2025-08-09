// Re-export core types from the main PDF types file for consistency
export type { PdfFeatureProps, PdfFeatureComponent } from '../../pdf/types';

/**
 * Props for feature overlay components that render on top of the PDF canvas.
 * Extends PdfFeatureProps with additional styling options.
 */
export interface FeatureOverlayProps extends PdfFeatureProps {
  /** Z-index for layering overlays */
  zIndex?: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Metadata for PDF feature plugins.
 * Used for plugin identification and management.
 */
export interface FeatureMetadata {
  /** Unique identifier for the feature */
  id: string;
  /** Human-readable name */
  name: string;
  /** Brief description of functionality */
  description: string;
  /** Semantic version string */
  version: string;
}