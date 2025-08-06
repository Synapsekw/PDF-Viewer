import React from 'react';
import { PdfFeatureComponent, PdfFeatureProps } from './types';

/**
 * Registry for managing PDF feature plugins.
 * 
 * This class provides a centralized way to register, retrieve,
 * and manage PDF feature components. Features are identified by unique IDs
 * and can be dynamically loaded and unloaded.
 * 
 * @class FeatureRegistry
 */
export class FeatureRegistry {
  private static features: Map<string, PdfFeatureComponent> = new Map();

  /**
   * Register a new PDF feature component.
   * 
   * @param {PdfFeatureComponent} feature - The feature to register
   */
  static register(feature: PdfFeatureComponent): void {
    const id = feature.displayName;
    
    if (!id) {
      console.error('Feature component must have a displayName');
      return;
    }
    
    if (this.features.has(id)) {
      // In development mode, React Strict Mode can cause duplicate registrations
      // Only warn if this is a different component (not just a re-registration)
      const existing = this.features.get(id);
      if (existing !== feature) {
        console.warn(`Feature with ID "${id}" is already registered with a different component. Overwriting...`);
      } else {
        // Same component being re-registered - this is normal in development
        console.debug(`Feature "${id}" already registered (React Strict Mode re-registration)`);
        return;
      }
    }
    
    this.features.set(id, feature);
    console.debug(`Registered feature: ${id}`);
  }

  /**
   * Unregister a feature by its ID.
   * 
   * @param {string} featureId - The feature ID to unregister
   * @returns {boolean} True if feature was removed, false if not found
   */
  static unregister(featureId: string): boolean {
    const removed = this.features.delete(featureId);
    if (removed) {
      console.debug(`Unregistered feature: ${featureId}`);
    }
    return removed;
  }

  /**
   * Retrieve a feature by its ID.
   * 
   * @param {string} featureId - The feature ID
   * @returns {PdfFeatureComponent | undefined} The feature or undefined if not found
   */
  static getFeature(featureId: string): PdfFeatureComponent | undefined {
    return this.features.get(featureId);
  }

  /**
   * Get all registered features.
   * 
   * @returns {PdfFeatureComponent[]} Array of all registered features
   */
  static getAllFeatures(): PdfFeatureComponent[] {
    return Array.from(this.features.values());
  }

  /**
   * Get all feature IDs.
   * 
   * @returns {string[]} Array of feature IDs
   */
  static getFeatureIds(): string[] {
    return Array.from(this.features.keys());
  }

  /**
   * Check if a feature is registered.
   * 
   * @param {string} featureId - The feature ID to check
   * @returns {boolean} True if feature is registered
   */
  static hasFeature(featureId: string): boolean {
    return this.features.has(featureId);
  }

  /**
   * Clear all registered features.
   */
  static clear(): void {
    this.features.clear();
    console.debug('Cleared all registered features');
  }
}

/**
 * Component for dynamically rendering registered features.
 * 
 * @component
 * @param {PdfFeatureProps & { featureId: string }} props - Feature props with ID
 * @returns {JSX.Element | null} Rendered feature component or null
 */
export const FeatureRenderer: React.FC<PdfFeatureProps & { featureId: string }> = ({
  featureId,
  ...props
}) => {
  const feature = FeatureRegistry.getFeature(featureId);
  if (!feature) {
    console.warn(`Feature "${featureId}" not found in registry`);
    return null;
  }

  const { Component } = feature;
  return <Component {...props} />;
};

export default FeatureRegistry;