import React, { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PdfFeatureProps } from '../../pdf/types';

/**
 * Props for feature overlay components that render on top of the PDF canvas.
 */
interface FeatureOverlayProps extends PdfFeatureProps {
  /** Z-index for layering overlays */
  zIndex?: number;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Props for FeatureOverlay component including children.
 */
interface FeatureOverlayPropsWithChildren extends FeatureOverlayProps {
  /** Child components to render in the overlay */
  children?: ReactNode;
}

/**
 * Feature overlay component that uses React portals to render content
 * on top of the PDF canvas without interfering with the PDF rendering.
 * 
 * This component provides a clean way for features to add visual overlays
 * while maintaining separation from the core PDF engine.
 * 
 * @component
 * @param {FeatureOverlayPropsWithChildren} props - Component props
 * @returns {React.ReactPortal | null} Portal to document body or null
 */
export const FeatureOverlay: React.FC<FeatureOverlayPropsWithChildren> = ({
  containerRef,
  children,
  zIndex = 1,
  className = '',
}) => {
  if (!containerRef.current) return null;

  return createPortal(
    <div
      className={`feature-overlay ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>,
    containerRef.current
  );
};

export default FeatureOverlay;