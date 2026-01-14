import * as vscode from "vscode";
import * as path from "node:path";
import { getWebviewContent } from "./getWebviewContent";
import { parsePayloadConfig } from "./utils/payload-config-parser";
import { CollectionInfo } from "./types/payload";

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

      // Find payload.config.ts and parse collections
      let collections: CollectionInfo[] = [];
      const configFiles = await vscode.workspace.findFiles(
        "**/payload.config.ts"
      );

      if (configFiles.length > 0) {
        const configPath = configFiles[0].fsPath;
        try {
          collections = await parsePayloadConfig(configPath);
          vscode.window.showInformationMessage(
            `Found ${collections.length} collections`
          );
        } catch (error) {
          vscode.window.showErrorMessage(
            `Failed to parse payload config: ${error}`
          );
        }
      }

      panel.webview.html = await getWebviewContent(
        context,
        panel.webview,
        collections
      );
    }
  );

  context.subscriptions.push(disposable);
}
