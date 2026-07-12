import * as path from "node:path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

/** Starts the bundled language server for file-backed Lumiere documents. */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const serverModule = context.asAbsolutePath(path.join("server", "server.js"));
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc },
  };
  const executablePath = vscode.workspace.getConfiguration("lumiere").get<string>("executablePath", "lumiere");
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: "file", language: "lumiere" }],
    initializationOptions: { executablePath },
  };

  client = new LanguageClient(
    "lumiereLanguageServer",
    "Lumiere Language Server",
    serverOptions,
    clientOptions,
  );
  context.subscriptions.push(client);
  await client.start();
}

/** Stops the language client and its bundled server process. */
export async function deactivate(): Promise<void> {
  await client?.stop();
}
