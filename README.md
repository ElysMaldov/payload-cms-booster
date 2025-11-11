# VSCode React Webview Template

A modern template for building Visual Studio Code extensions with React-powered webviews using Vite.

## Features

- 🚀 **Fast Development** - Powered by Vite with Hot Module Replacement (HMR)
- ⚛️ **React 18** - Build modern UIs with React
- 🔄 **Dual Mode Support** - Seamless development and production builds
- 🔒 **Secure CSP** - Content Security Policy configured for both dev and production
- 📦 **TypeScript** - Full TypeScript support for type safety

## What's Inside

This template provides a complete setup for creating VS Code extensions with React webviews:

- **Extension Host** ([src/extension.ts](src/extension.ts)) - The main extension entry point
- **Webview Content Handler** ([src/getWebviewContent.ts](src/getWebviewContent.ts)) - Smart content delivery for dev/prod
- **React Application** ([webview/src/](webview/src/)) - Your React webview UI
- **Vite Configuration** ([webview/vite.config.ts](webview/vite.config.ts)) - Optimized build setup

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Visual Studio Code

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
cd webview
npm install
cd ..
```

### Development

1. **Start the Vite dev server** (in one terminal):
   ```bash
   cd webview
   npm run dev
   ```

2. **Launch the extension** (in VS Code):
   - Press `F5` to open a new Extension Development Host window
   - Run the command `Hello World` from the Command Palette (`Ctrl+Shift+P`)

3. **See your changes live** - Edit files in `webview/src/` and see instant updates with HMR

### Building for Production

1. **Build the React app**:
   ```bash
   cd webview
   npm run build
   ```

2. **Package the extension**:
   ```bash
   vsce package
   ```

## Project Structure

```
.
├── src/
│   ├── extension.ts           # Extension activation & commands
│   └── getWebviewContent.ts   # Webview HTML generation
├── webview/
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   └── main.tsx          # React entry point
│   ├── vite.config.ts        # Vite configuration
│   └── package.json          # Webview dependencies
└── package.json              # Extension manifest
```

## How It Works

### Development Mode

- Runs a Vite dev server on port 5174
- Webview loads React app from `http://localhost:5174`
- Enables HMR for instant feedback
- CSP configured to allow dev server connections

### Production Mode

- Webview serves static files from `webview/dist/`
- All assets are properly resolved using VS Code's webview URI scheme
- Strict CSP for security
- Optimized and bundled code

## Customization

### Modify the React App

Edit files in `webview/src/`:
- [`App.tsx`](webview/src/App.tsx) - Main React component
- [`App.css`](webview/src/App.css) - Styling

### Add Extension Commands

Modify [`src/extension.ts`](src/extension.ts) to add new commands or functionality.

### Configure Vite

Adjust build settings in [`webview/vite.config.ts`](webview/vite.config.ts).

## Security

This template implements Content Security Policy (CSP) for both development and production:

- Restricts script sources to approved origins
- Prevents inline scripts (except with nonce)
- Limits resource loading to trusted sources

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.