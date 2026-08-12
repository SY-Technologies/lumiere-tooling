# Lumiere Language Support

Official editor support for `.lum` files:

- syntax highlighting
- light and dark file icons
- bracket, comment, and indentation configuration
- compiler-backed syntax diagnostics for saved and unsaved files
- compiler-backed hover for language keywords and source declarations

The extension runs locally and sends no source code or telemetry anywhere.

## Compiler Setup

Install Lumiere so `lumiere` is available on `PATH`, or set
`lumiere.executablePath` to the absolute path of the executable.

Diagnostics and hover information come from the real Lumiere lexer and parser.
The extension does not maintain a second parser. Hover requires a Lumiere build
that supports inspection protocol 2. Write declaration documentation with
`/** ... */`; hovering the declaration or one of its references displays it.
