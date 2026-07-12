# Lumiere Tooling

Editor-independent tooling for the Lumiere language. Language rules remain in
the Lumiere compiler; this repository translates compiler diagnostics and
source inspection into LSP features and packages editor integration.

## Development

Requirements: Node.js 20.18.1 or newer and a built `lumiere` executable.

```bash
npm install
npm test
npm run build
```

Set `LUMIERE_EXECUTABLE` to the compiler path when `lumiere` is not available
on `PATH`.

```bash
LUMIERE_EXECUTABLE=../lumiere/build_tests/lumiere npm test
```

The VS Code setting `lumiere.executablePath` overrides both defaults.

## Repository Layout

```text
packages/language-server/   LSP process and compiler protocol adapter
packages/vscode-extension/  VS Code client, grammar, and language configuration
```

The server sends the current editor buffer to:

```bash
lumiere check --format=json --stdin --source-path /absolute/file.lum
lumiere inspect --format=json --stdin --source-path /absolute/file.lum --offset 42
```

It debounces edits, cancels superseded analysis for the same document, rejects
unknown compiler protocol versions, converts compiler byte offsets to LSP
UTF-16 positions, publishes diagnostics, and requests hover information at the
cursor. Diagnostics and hover use independent compiler processes, and separate
documents cannot cancel each other's work.

## Build A VSIX

```bash
npm run package:vscode
```

The artifact is written to `packages/vscode-extension/`. Install it in VS Code
with **Extensions: Install from VSIX**, then configure
`lumiere.executablePath` if the compiler is not on `PATH`.

## Tests

```bash
npm test
```

To include the real compiler subprocess integration test:

```bash
LUMIERE_EXECUTABLE=/absolute/path/to/lumiere npm test
```

CI runs compilation, protocol/range tests, grammar manifest tests, bundling,
and VSIX packaging. Compiler integration remains a local or future cross-repo
CI test because this repository does not duplicate or build the compiler.

## Design Boundary

Lumiere owns tokens, parsing, semantic rules, source ranges, and diagnostics.
This repository owns process management and editor protocol conversion. A new
language feature should first be implemented in Lumiere; highlighting is then
updated here only when lexical presentation changes.

## Deployment

Every CI run uploads an installable VSIX artifact. Pushing a version tag builds,
tests, packages, and attaches that VSIX to a GitHub Release:

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

Store publication is deliberately manual. Configure these GitHub Actions
repository secrets:

| Store | Secret | Required identity |
|---|---|---|
| Visual Studio Marketplace | `VSCE_PAT` | Publisher matching `lumiere-lang` |
| Open VSX | `OVSX_PAT` | Namespace matching `lumiere-lang` |

Then run **Publish Extension** from GitHub Actions and select either store. The
workflow first rebuilds and tests the exact VSIX before publishing it.

Do not change the publisher field merely to satisfy CI. The manifest publisher,
Marketplace publisher, and Open VSX namespace are public extension identity and
must intentionally match.
