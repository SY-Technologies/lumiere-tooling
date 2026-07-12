const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");

const extensionRoot = path.resolve(__dirname, "..");

async function build() {
  fs.rmSync(path.join(extensionRoot, "dist"), { recursive: true, force: true });
  fs.rmSync(path.join(extensionRoot, "server"), { recursive: true, force: true });

  await esbuild.build({
    entryPoints: [path.join(extensionRoot, "src", "extension.ts")],
    outfile: path.join(extensionRoot, "dist", "extension.js"),
    bundle: true,
    external: ["vscode"],
    format: "cjs",
    platform: "node",
    sourcemap: true,
    target: "node20",
  });
  await esbuild.build({
    entryPoints: [path.resolve(extensionRoot, "..", "language-server", "src", "server.ts")],
    outfile: path.join(extensionRoot, "server", "server.js"),
    bundle: true,
    format: "cjs",
    platform: "node",
    sourcemap: true,
    target: "node20",
  });
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
