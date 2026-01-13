import * as vscode from "vscode";
import * as path from "node:path";
import { getWebviewContent } from "./getWebviewContent";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "payload-cms-booster.visualize",
    async () => {
      const panel = vscode.window.createWebviewPanel(
        "payloadCMSVisualizer",
        "Payload CMS Visualizer",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "webview", "dist"))
          ]
        }
      );

      panel.webview.html = await getWebviewContent(context, panel.webview);
    }
  );

  context.subscriptions.push(disposable);
}
