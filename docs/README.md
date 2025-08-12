# PDF Viewer

A modular, extensible PDF viewer built with React and TypeScript, featuring a clean plugin architecture and comprehensive analytics tracking.

## Features

- 📄 **PDF Rendering**: Powered by PDF.js for reliable PDF rendering
- 🔍 **Zoom & Rotate**: Full zoom and rotation controls
- 📊 **Analytics**: Comprehensive user interaction tracking
- 🎯 **Mouse Heatmap**: Visual heatmap of user mouse activity
- ✂️ **Snipping Tool**: Select and export PDF regions
- 📤 **Data Export**: Export analytics as JSON or HTML reports
- 🧩 **Plugin System**: Extensible architecture for custom features
- 🎨 **Modern UI**: Clean, responsive interface
- 👤 **User Settings**: Customizable themes, notifications, privacy controls, and language preferences
- 📤 **PDF Library**: IndexedDB storage with high-quality thumbnails, search, and organization
- 🔗 **Share Links**: Generate public links to share PDFs with automatic analytics tracking

## Architecture

The PDF Viewer follows a clean separation architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PDF Engine    │    │   Context APIs   │    │    Plugins      │
│                 │    │                  │    │                 │
│ • PDF.js Core   │◄──►│ • PdfContext     │◄──►│ • Analytics     │
│ • Canvas Render │    │ • AnalyticsCtx   │    │ • Overlays      │
│ • Page Logic    │    │ • Event System   │    │ • Tools         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Principles

1. **Clean Separation**: Features never directly modify the PDF engine
2. **Context-Based**: All communication happens through React contexts
3. **Plugin Architecture**: Features are self-contained, loadable plugins
4. **TypeScript First**: Comprehensive type safety and documentation

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── pdf/                    # Core PDF engine
│   ├── PdfEngine.tsx      # PDF.js integration
│   ├── PdfContext.tsx     # PDF state management
│   └── types.ts           # PDF-related types
├── contexts/              # React contexts
│   └── AnalyticsContext.tsx
├── components/            # UI components
│   ├── controls/          # Control components
│   └── Modal.tsx
├── features/              # Feature plugins
│   ├── analytics/         # Analytics features
│   ├── snipping/          # Snipping tool
│   ├── export/            # Data export
│   └── base/              # Base plugin system
├── plugins/               # Plugin configuration
│   └── index.ts           # Plugin registry
└── App.tsx               # Main application
```

## Plugin Development

The PDF Viewer supports custom plugins for extending functionality. See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed plugin development guidelines.

### Quick Plugin Example

```typescript
import React from 'react';
import { PdfFeatureProps, PdfFeatureComponent } from '../pdf/types';
import { usePdf } from '../pdf/PdfContext';

const MyPluginComponent: React.FC<PdfFeatureProps> = ({ canvasRef, containerRef }) => {
  const { currentPage } = usePdf();
  
  return <div>Current page: {currentPage}</div>;
};

export const MyPlugin: PdfFeatureComponent = {
  displayName: 'MyPlugin',
  Component: MyPluginComponent,
};
```

## Available Plugins

### Analytics
- **Mouse Heatmap**: Tracks and visualizes mouse movements
- **Analytics Overlay**: Displays session information
- **Interaction Tracking**: Records user interactions

### Tools
- **Snipping Tool**: Select and export PDF regions
- **Export Panel**: Export analytics data as JSON/HTML

### Adding New Plugins

1. Create your plugin in `src/features/your-plugin/`
2. Add it to `src/plugins/index.ts`
3. Follow the [plugin development guide](./CONTRIBUTING.md)

## Configuration

Plugins can be configured in `src/plugins/index.ts`:

```typescript
{
  id: 'mouse-heatmap',
  name: 'Mouse Heatmap',
  enabled: true,
  priority: 1,
  config: {
    gridSize: 20,
    fadeTime: 30000,
    opacity: 0.6,
  },
}
```

## Analytics Features

### Data Tracking
- Page views and time spent
- Mouse movements and clicks
- Zoom and rotation changes
- Navigation patterns
- Tool usage statistics

### Export Options
- **JSON**: Raw analytics data
- **HTML**: Formatted reports with charts
- **Screenshots**: Current page captures

## Technology Stack

- **React 18**: Modern React with hooks
- **TypeScript**: Full type safety
- **PDF.js**: PDF rendering engine
- **Vite**: Fast development and building
- **D3**: Data visualization for heatmaps

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Plugin development guidelines
- Code standards and best practices
- Testing requirements
- Submission process

## License

MIT License - see [LICENSE](./LICENSE) for details.

## User Page & Settings

The User page provides a centralized location for managing user preferences and settings:

### Available Settings

1. **Appearance**
   - Theme selection: Light, Dark, or System Default
   - Theme changes are applied immediately and persisted

2. **Notifications**
   - Email notifications toggle
   - In-app notifications toggle

3. **Privacy**
   - Analytics tracking opt-in/opt-out
   - Connects directly to the AnalyticsProvider

4. **Language**
   - Select from 6 supported languages (placeholder for future i18n)

### Storage Mechanism

- Settings are stored in localStorage under the `userSettings` key
- Theme preferences are also stored separately for the ThemeProvider
- Future integration with Supabase for authenticated users

### Extending Settings

To add new settings:
1. Update the `UserSettings` type in `src/features/user/types.ts`
2. Add the UI component in the appropriate section
3. Update the storage logic if needed

## Share Links (Dev Mode)

The PDF Viewer includes a comprehensive share link system that allows users to share PDFs publicly with automatic analytics tracking.

### Features

#### Public Sharing
- Generate secure, unique share links for any PDF in your library
- Recipients can view PDFs without creating an account
- Share links include both landing page (`/s/:token`) and direct viewer (`/v/:token`)

#### Public Landing Page (`/s/:token`)
- Clean, branded landing page showing document metadata
- Document title, file size, and preview information
- "View Document" button leading to the viewer
- Handles invalid/expired tokens gracefully

#### Minimal Public Viewer (`/v/:token`)
- Streamlined PDF viewer with essential controls only
- Includes AI assistant for document questions
- No internal navigation, settings, or admin controls
- Optimized for public viewing experience

#### Automatic Analytics
- **Session Tracking**: Every view session is automatically tracked
- **Page Views**: Track which pages users spend time on
- **Time Tracking**: Monitor how long users engage with content
- **Interaction Analytics**: Text selections and engagement metrics
- **Heartbeat Monitoring**: Regular activity checks every 15 seconds

#### Comprehensive Reports
- **Reports Dashboard**: View analytics for all shared documents at `/reports`
- **Session Analytics**: Total views, unique sessions, average duration
- **Page Analysis**: Most viewed pages and engagement patterns
- **HTML Export**: Download detailed HTML reports with charts and metrics
- **Real-time Updates**: Reports update as new sessions occur

### Usage

1. **Generate Share Link**:
   - Click the share button on any PDF in your library
   - Copy the generated public URL
   - Share with recipients via email, messaging, etc.

2. **Public Access**:
   - Recipients visit the share link
   - View document metadata on landing page
   - Click "View Document" to access the PDF viewer

3. **Analytics Collection**:
   - Analytics start automatically when viewer loads
   - All interactions are tracked without user intervention
   - Session data is stored and aggregated for reporting

4. **View Reports**:
   - Access `/reports` to see analytics for all shared documents
   - Filter by document or time period
   - Download detailed HTML reports

### Technical Implementation

#### Dev Mode (Current)
- **Share Repository**: IndexedDB storage for share tokens
- **Analytics**: Local session tracking with comprehensive event collection
- **Reports**: Local report generation with HTML export
- **Token Generation**: Cryptographically secure random tokens
- **Data Storage**: All data stored locally in IndexedDB

#### Architecture
```
Share Link Generation
├── Library → Share Button
├── ShareService → Token Generation
├── IndexedDB → Token Storage
└── Public URL → /s/:token

Public Viewing Flow
├── Landing (/s/:token) → Document Info
├── Viewer (/v/:token) → PDF + AI Chat
├── Analytics → Session Tracking
└── Reports → Aggregated Metrics
```

#### Data Layer Abstraction
The system is designed for easy backend migration:
- **Repository Pattern**: Clean interfaces for data operations
- **Mode Switching**: `SHARE_MODE` constant in `shareService.ts`
- **Future Supabase**: Drop-in replacement for local repositories
- **No UI Changes**: Interface switching requires no component updates

### Current Limitations (Dev Mode)
- **Local Only**: Share links only work on the same device/browser
- **No Persistence**: Data lost if browser storage is cleared
- **No Collaboration**: Can't sync between team members
- **Limited Scale**: IndexedDB storage limitations apply

These limitations will be resolved when migrating to Supabase backend.

## Roadmap

- [ ] Annotation system
- [ ] Text search and highlighting
- [ ] Bookmarks and navigation
- [ ] Multi-document support
- [ ] Real-time collaboration
- [ ] Advanced analytics dashboards

## Support

- 📖 Documentation: See `/docs` folder
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-repo/issues)
- 💡 Feature Requests: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📧 Contact: your-email@example.com