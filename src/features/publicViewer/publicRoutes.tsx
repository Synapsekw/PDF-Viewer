/**
 * Public routes for shared PDF viewing
 */

import React from 'react';
import PublicLanding from './PublicLanding';
import PublicViewer from './PublicViewer';

export const PublicLandingRoute: React.FC = () => <PublicLanding />;
export const PublicViewerRoute: React.FC = () => <PublicViewer />;