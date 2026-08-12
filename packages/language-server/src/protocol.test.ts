import assert from "node:assert/strict";
import test from "node:test";
import { parseCheckResult, parseInspectionResult } from "./protocol";

test("accepts diagnostic protocol version 1", () => {
  const result = parseCheckResult(JSON.stringify({
    protocolVersion: 1,
    source: "main.lum",
    diagnostics: [{
      code: "LUM-P0001",
      severity: "error",
      message: "syntaxe invalide",
      range: { start: 2, end: 3 },
      line: 1,
      column: 3,
    }],
  }));

  assert.equal(result.diagnostics[0].code, "LUM-P0001");
});

test("parses a valid inspection response", () => {
  const result = parseInspectionResult(
    JSON.stringify({
      protocolVersion: 2,
      inspection: {
        label: "x",
        kind: "variable",
        signature: "soit x: Entier",
        parameters: [],
        returnType: "Entier",
        documentation: "",
        range: { start: 5, end: 6 },
      },
    }),
  );

  assert.equal(result.inspection?.label, "x");
  assert.equal(result.inspection?.signature, "soit x: Entier");
});

test("accepts an empty inspection response", () => {
  assert.equal(parseInspectionResult('{"protocolVersion":2,"inspection":null}').inspection, null);
});
test("rejects an unsupported inspection protocol version", () => {
  assert.throws(
    () => parseInspectionResult('{"protocolVersion":1,"inspection":null}'),
    /invalid inspection response/,
  );
});
test("rejects an unsupported protocol version", () => {
  assert.throws(
    () => parseCheckResult('{"protocolVersion":2,"source":"main.lum","diagnostics":[]}'),
    /Unsupported Lumiere diagnostic protocol 2/,
  );
});

test("rejects malformed diagnostics", () => {
  assert.throws(
    () => parseCheckResult('{"protocolVersion":1,"source":"main.lum","diagnostics":[{}]}'),
    /invalid diagnostic response/,
  );
});
