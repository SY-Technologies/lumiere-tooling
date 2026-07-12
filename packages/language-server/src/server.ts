import { fileURLToPath } from "node:url";
import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeParams,
  ProposedFeatures,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { LumiereCompiler } from "./compiler";
import { byteRangeToLspRange } from "./positions";
import { LumiereSeverity } from "./protocol";

interface InitializationOptions {
  executablePath?: string;
}

interface LumiereSettings {
  executablePath?: string;
}

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const pendingAnalysis = new Map<string, NodeJS.Timeout>();
const documentVersions = new Map<string, number>();
const compilers = new Map<string, LumiereCompiler>();
let compilerExecutable = process.env.LUMIERE_EXECUTABLE || "lumiere";

connection.onInitialize((params: InitializeParams) => {
  const options = params.initializationOptions as InitializationOptions | undefined;
  if (options?.executablePath) {
    compilerExecutable = options.executablePath;
  }
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
    },
  };
});

connection.onInitialized(() => {
  void connection.client.register(DidChangeConfigurationNotification.type);
});

connection.onDidChangeConfiguration(async () => {
  const settings = await connection.workspace.getConfiguration("lumiere") as LumiereSettings;
  compilerExecutable = settings.executablePath || process.env.LUMIERE_EXECUTABLE || "lumiere";
  for (const compiler of compilers.values()) {
    compiler.cancel();
  }
  compilers.clear();
  for (const document of documents.all()) {
    scheduleAnalysis(document);
  }
});

documents.onDidOpen((event) => {
  scheduleAnalysis(event.document);
});

documents.onDidChangeContent((event) => {
  scheduleAnalysis(event.document);
});

documents.onDidClose((event) => {
  const pending = pendingAnalysis.get(event.document.uri);
  if (pending) {
    clearTimeout(pending);
    pendingAnalysis.delete(event.document.uri);
  }
  documentVersions.delete(event.document.uri);
  compilers.get(event.document.uri)?.cancel();
  compilers.delete(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

/** Debounces analysis and cancels superseded work for one document. */
function scheduleAnalysis(document: TextDocument): void {
  const previous = pendingAnalysis.get(document.uri);
  if (previous) {
    clearTimeout(previous);
  }
  compilers.get(document.uri)?.cancel();
  documentVersions.set(document.uri, document.version);
  pendingAnalysis.set(document.uri, setTimeout(() => {
    pendingAnalysis.delete(document.uri);
    void analyze(document);
  }, 150));
}

/** Publishes compiler diagnostics only if the analyzed document version is current. */
async function analyze(document: TextDocument): Promise<void> {
  const version = document.version;
  const source = document.getText();
  try {
    const sourcePath = document.uri.startsWith("file:") ? fileURLToPath(document.uri) : document.uri;
    const result = await compilerFor(document.uri).check(source, sourcePath);
    if (documentVersions.get(document.uri) !== version) {
      return;
    }
    const diagnostics: Diagnostic[] = result.diagnostics.map((item) => ({
      code: item.code,
      severity: toLspSeverity(item.severity),
      message: item.message,
      range: byteRangeToLspRange(source, item.range.start, item.range.end),
      source: "lumiere",
    }));
    connection.sendDiagnostics({ uri: document.uri, version, diagnostics });
  } catch (error) {
    if (documentVersions.get(document.uri) === version && !isCancellation(error)) {
      connection.console.error(error instanceof Error ? error.message : String(error));
    }
  }
}

/** Returns the independent compiler process owner assigned to a document URI. */
function compilerFor(uri: string): LumiereCompiler {
  let compiler = compilers.get(uri);
  if (!compiler) {
    compiler = new LumiereCompiler(compilerExecutable);
    compilers.set(uri, compiler);
  }
  return compiler;
}

/** Maps the compiler protocol severity to its LSP numeric equivalent. */
function toLspSeverity(severity: LumiereSeverity): DiagnosticSeverity {
  switch (severity) {
    case "error":
      return DiagnosticSeverity.Error;
    case "warning":
      return DiagnosticSeverity.Warning;
    case "information":
      return DiagnosticSeverity.Information;
    case "hint":
      return DiagnosticSeverity.Hint;
  }
}

/** Distinguishes expected supersession from actionable compiler failures. */
function isCancellation(error: unknown): boolean {
  return error instanceof Error && error.message === "Lumiere analysis was cancelled";
}

documents.listen(connection);
connection.listen();
