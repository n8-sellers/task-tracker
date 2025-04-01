# Technical Context: Task Tracker Web App

## Technology Stack

### Frontend
- **HTML5**: Semantic markup for structure
- **CSS3/SASS**: Modern styling with variables and nesting
- **JavaScript (ES6+)**: Core application logic
- **No Framework Approach**: Vanilla JS for simplicity and performance

### Libraries & Dependencies
- **PapaParse**: CSV parsing and handling (https://www.papaparse.com/)
- **Chart.js**: Versatile charting library (https://www.chartjs.org/)
- **localForage**: IndexedDB wrapper for easier storage handling (https://localforage.github.io/localForage/)
- **Day.js**: Lightweight date manipulation (https://day.js.org/)

### Storage
- **IndexedDB**: Primary storage for structured data
- **LocalStorage**: Settings and application state

### Build & Development Tools
- No build process required (could add simple bundling later if needed)
- Vanilla development without complex tooling

## Development Setup

### Project Structure
```
/
├── index.html            # Main entry point
├── styles/               # CSS files
│   ├── main.css          # Main stylesheet
│   ├── dashboard.css     # Dashboard-specific styles
│   ├── detail.css        # Detail view styles
│   └── history.css       # Historical view styles
├── scripts/              # JavaScript modules
│   ├── app.js            # Application initialization
│   ├── csv.js            # CSV handling
│   ├── store.js          # Data storage
│   ├── dashboard.js      # Dashboard view
│   ├── detail.js         # Detail view
│   ├── history.js        # Historical tracking
│   ├── search.js         # Search functionality
│   └── visualizations.js # Chart and table rendering
└── assets/               # Static assets
    ├── icons/            # UI icons
    └── sample-data/      # Sample CSV files for testing
```

### Browser Support
- Modern browsers with ES6+ and IndexedDB support:
  - Chrome (latest 2 versions)
  - Firefox (latest 2 versions)
  - Safari (latest 2 versions)
  - Edge (latest 2 versions)

## Technical Constraints

### Client-Side Only
- All processing happens in the browser
- No backend or API dependencies
- Data never leaves the client's machine

### Storage Limitations
- Browser storage limits (typically ~50MB for IndexedDB)
- Performance considerations for large datasets

### CSV Format Expectations
- Consistent column structure between uploads
- UniqueID column for tracking individual records
- Standard CSV formatting (comma-separated, quoted as needed)

### Performance Considerations
- Efficient data structure for quick filtering and searching
- Pagination for large datasets
- Lazy loading of visualizations
- Memory management for historical data

## Deployment Strategy
- Static file hosting (GitHub Pages, Netlify, Vercel, etc.)
- Simple deployment with no build process required
- Ability to run locally by opening index.html
