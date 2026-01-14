import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { CollectionInfo } from "./types/payload";

const PORT = 5174;

interface DevUris {
    refreshUri: vscode.Uri;
    clientUri: vscode.Uri;
    entryUri: vscode.Uri;
    origin: string;
    wsOrigin: string;
}

function createBaseCSP(webview: vscode.Webview): string[] {
    return [
        `default-src 'none'`,
        `img-src ${webview.cspSource} https: data:`,
        `style-src ${webview.cspSource} 'unsafe-inline'`,
        `font-src ${webview.cspSource} https:`,
        `frame-src ${webview.cspSource} https:`,
    ];
}

function createDevCSP(
    webview: vscode.Webview,
    nonce: string,
    origin: string,
    wsOrigin: string,
): string {
    return (
        [
            ...createBaseCSP(webview),
            `script-src 'nonce-${nonce}' 'unsafe-eval' ${origin}`,
            `connect-src ${origin} ${wsOrigin} ws://localhost:${PORT} ws://127.0.0.1:${PORT}`,
        ].join("; ") + ";"
    );
}

function createProdCSP(webview: vscode.Webview, nonce: string): string {
    return (
        [
            ...createBaseCSP(webview),
            `script-src 'nonce-${nonce}' ${webview.cspSource}`,
            `connect-src ${webview.cspSource}`,
        ].join("; ") + ";"
    );
}

async function getDevUris(): Promise<DevUris> {
    const refreshLocal = vscode.Uri.parse(
        `http://localhost:${PORT}/@react-refresh`,
    );
    const clientLocal = vscode.Uri.parse(`http://localhost:${PORT}/@vite/client`);
    const entryLocal = vscode.Uri.parse(`http://localhost:${PORT}/src/main.tsx`);

    const [refreshUri, clientUri, entryUri] = await Promise.all([
        vscode.env.asExternalUri(refreshLocal),
        vscode.env.asExternalUri(clientLocal),
        vscode.env.asExternalUri(entryLocal),
    ]);

    const origin = `${clientUri.scheme}://${clientUri.authority}`;
    const wsOrigin = origin.replace(/^http/, "ws");

    return { refreshUri, clientUri, entryUri, origin, wsOrigin };
}

function createDevHTML(
    nonce: string,
    uris: DevUris,
    csp: string,
    collectionsJson: string,
): string {
    return `
    <!doctype html>
    <html>
        <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp}">
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Dev</title>
        </head>
        <body>
        <div id="root"></div>

        <script>
            window.__PAYLOAD_COLLECTIONS__ = ${collectionsJson};
        </script>

        <script type="module" nonce="${nonce}">
            import RefreshRuntime from "${uris.refreshUri.toString(true)}";
            RefreshRuntime.injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;
        </script>

        <script type="module" nonce="${nonce}" src="${uris.clientUri.toString(true)}"></script>
        <script type="module" nonce="${nonce}" src="${uris.entryUri.toString(true)}"></script>
        </body>
    </html>
    `;
}

function processProductionHtml(
    htmlContent: string,
    webview: vscode.Webview,
    distPath: string,
    nonce: string,
    collectionsJson: string,
): string {
    const processedHtml = htmlContent.replace(
        /(href|src)=["']([^"']*)["']/g,
        (match, attr, url) => {
            if (
                url.startsWith("http") ||
                url.startsWith("data:") ||
                url.startsWith("#") ||
                url === ""
            ) {
                return match;
            }
            const clean = url.replace(/^\//, "");
            const onDisk = vscode.Uri.file(path.join(distPath, clean));
            const webviewUri = webview.asWebviewUri(onDisk).toString();
            return `${attr}="${webviewUri}"`;
        },
    );

    const csp = createProdCSP(webview, nonce);

    return processedHtml
        .replace(
            "</head>",
            `<meta http-equiv="Content-Security-Policy" content="${csp}"></head>`,
        )
        .replace(
            /<script([^>]*)type="module"([^>]*)>/g,
            `<script$1type="module"$2 nonce="${nonce}">`,
        )
        .replace(
            "</body>",
            `<script>window.__PAYLOAD_COLLECTIONS__ = ${collectionsJson};</script></body>`,
        );
}

export async function getWebviewContent(
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    collections: CollectionInfo[] = [],
): Promise<string> {
    const isDev = context.extensionMode === vscode.ExtensionMode.Development;
    const nonce = randomUUID();
    const collectionsJson = JSON.stringify(collections);

    if (isDev) {
        const uris = await getDevUris();
        const csp = createDevCSP(webview, nonce, uris.origin, uris.wsOrigin);
        return createDevHTML(nonce, uris, csp, collectionsJson);
    }

    const htmlPath = path.join(
        context.extensionPath,
        "webview",
        "dist",
        "index.html",
    );
    const distPath = path.join(context.extensionPath, "webview", "dist");
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    return processProductionHtml(
        htmlContent,
        webview,
        distPath,
        nonce,
        collectionsJson,
    );
}