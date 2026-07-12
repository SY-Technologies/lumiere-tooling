import { Position, Range } from "vscode-languageserver/node";

/**
 * Converts a half-open Lumiere UTF-8 byte range to an LSP UTF-16 range.
 */
export function byteRangeToLspRange(source: string, start: number, end: number): Range {
  return Range.create(byteOffsetToPosition(source, start), byteOffsetToPosition(source, end));
}

/**
 * Converts a zero-based UTF-8 byte offset to a zero-based LSP position.
 *
 * Offsets beyond the buffer clamp to EOF. An invalid offset inside a multibyte
 * code point clamps to that code point's start rather than splitting it.
 */
export function byteOffsetToPosition(source: string, requestedOffset: number): Position {
  const offset = Math.max(0, requestedOffset);
  let bytes = 0;
  let line = 0;
  let character = 0;

  for (const codePoint of source) {
    const encodedLength = Buffer.byteLength(codePoint, "utf8");
    if (bytes + encodedLength > offset) {
      break;
    }
    bytes += encodedLength;
    if (codePoint === "\n") {
      line += 1;
      character = 0;
    } else {
      character += codePoint.length;
    }
  }
  return Position.create(line, character);
}
