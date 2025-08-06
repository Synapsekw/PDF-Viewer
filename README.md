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