import assert from "node:assert/strict";
import test from "node:test";
import { byteOffsetToPosition, byteRangeToLspRange, positionToByteOffset } from "./positions";

test("converts UTF-8 byte offsets to UTF-16 positions", () => {
  const source = "soit café = \"💡\"\nretourne café";

  assert.deepEqual(byteOffsetToPosition(source, 10), { line: 0, character: 9 });
  assert.deepEqual(byteOffsetToPosition(source, 14), { line: 0, character: 13 });
  assert.deepEqual(byteOffsetToPosition(source, 18), { line: 0, character: 15 });
  assert.deepEqual(byteOffsetToPosition(source, 20), { line: 1, character: 0 });
});

test("converts UTF-16 positions back to UTF-8 byte offsets", () => {
  const source = "éclair\n😀 café";

  assert.equal(positionToByteOffset(source, { line: 0, character: 1 }), 2);
  assert.equal(positionToByteOffset(source, { line: 1, character: 3 }), 13);
});
test("clamps offsets inside a multibyte code point to its start", () => {
  assert.deepEqual(byteOffsetToPosition("é", 1), { line: 0, character: 0 });
  assert.deepEqual(byteOffsetToPosition("é", 2), { line: 0, character: 1 });
});

test("creates an LSP range from compiler byte offsets", () => {
  assert.deepEqual(byteRangeToLspRange("a💡b", 1, 5), {
    start: { line: 0, character: 1 },
    end: { line: 0, character: 3 },
  });
});
