# Product

payload-cms-booster is a Visual Studio Code extension that enhances developer productivity when working with Payload CMS by providing a visualizer interface integrated directly into VS Code.

## Problems It Solves

- **Complex Relationship Mapping**: Payload CMS collections often have complex relationships between them. This extension allows developers to visualize these relationships in a mind-map like canvas.
- **Development Context Switching**: Developers can understand CMS structure without leaving their IDE.
- **Mental Model Building**: Visual representation helps developers understand the data model quickly.

## How It Should Work

1. User activates the extension via command palette (`Payload CMS Booster: Visualize`)
2. A webview panel opens showing a React Flow canvas
3. The canvas displays Payload CMS collections as nodes
4. Relationships between collections are shown as edges/connections
5. Developers can interact with the visualization (pan, zoom, drag nodes)

## User Experience Goals

- **Seamless Integration**: Works within VS Code without external dependencies
- **Fast Feedback**: HMR in development mode for instant updates
- **Clean UI**: Intuitive React Flow interface with controls and minimap
- **Responsive**: Adapts to different screen sizes

## Target Users

- Payload CMS developers building applications with complex data models
- Teams onboarding new developers who need to understand existing CMS structure
- Architects designing and reviewing collection relationships