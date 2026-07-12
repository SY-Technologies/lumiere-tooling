# Lumiere Language Support

Official editor support for `.lum` files:

- syntax highlighting
- bracket, comment, and indentation configuration
- compiler-backed syntax diagnostics for saved and unsaved files

The extension runs locally and sends no source code or telemetry anywhere.

## Compiler Setup

Install Lumiere so `lumiere` is available on `PATH`, or set
`lumiere.executablePath` to the absolute path of the executable.

Diagnostics come from the real Lumiere lexer and parser. The extension does not
maintain a second parser.
