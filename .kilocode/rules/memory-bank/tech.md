# Technologies

## Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Extension Host | TypeScript | ^5.9.2 | Extension logic |
| VS Code API | @types/vscode | ^1.105.0 | VS Code integration |
| Webview UI | React | ^19.2.0 | UI framework |
| Webview UI | React DOM | ^19.2.0 | DOM rendering |
| Visualization | @xyflow/react | ^12.10.0 | Node/edge canvas |
| Build Tool | Vite | ^7.2.2 | Fast bundler |
| Bundler | TypeScript | ~5.9.3 | TypeScript compiler |
| Plugin | @vitejs/plugin-react-swc | ^4.2.1 | React Fast Refresh |

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- Visual Studio Code (for extension development)
- pnpm (recommended) or npm

### Installation
```bash
# Install root dependencies
pnpm install

# Install webview dependencies
cd webview
pnpm install
cd ..
```

### Development Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `pnpm run dev` | webview/ | Start Vite dev server (port 5174) |
| `pnpm run watch` | root/ | Watch extension TypeScript |
| `F5` (in VS Code) | - | Launch Extension Development Host |
| `pnpm run build` | webview/ | Build production webview |
| `pnpm run lint` | root/ | Lint extension code |

### Project Structure

```
payload-cms-booster/
├── src/                          # Extension host
│   ├── extension.ts             # Main entry point
│   └── getWebviewContent.ts     # Webview content generator
├── webview/                      # React webview
│   ├── src/                      # React source
│   │   ├── App.tsx
│   │   └── ui/payload-visualizer/
│   ├── dist/                     # Production build output
│   ├── vite.config.ts           # Vite configuration
│   └── package.json             # Webview dependencies
├── package.json                  # Extension manifest
└── tsconfig.json                 # Extension TS config
```

## Technical Constraints

1. **VS Code Version**: Must target VS Code 1.105.0 or higher
2. **Webview Security**: Must implement CSP with nonces for script execution
3. **Local Resources**: Webview can only load from extension's `webview/dist/` in production
4. **React 19**: Using latest React with concurrent features
5. **Node.js**: Extension uses Node.js APIs (`path`, `fs`, `crypto`)

## Dependencies

### Extension Host
- `@types/vscode`: VS Code type definitions
- `@types/node`: Node.js type definitions
- `@typescript-eslint/*`: Linting

### Webview
- `@xyflow/react`: React Flow visualization library
- `react` / `react-dom`: UI framework
- `vite`: Build tool with HMR

## Tool Usage Patterns

1. **Vite Dev Server**: Runs on port 5174, enables HMR for instant webview updates
2. **Extension Development**: Press F5 in VS Code to test in Extension Development Host
3. **Production Build**: Build webview first, then package with `vsce package`
4. **Webview URI Resolution**: Uses `webview.asWebviewUri()` for resource mapping