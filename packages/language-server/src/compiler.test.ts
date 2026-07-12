import assert from "node:assert/strict";
import test from "node:test";
import { LumiereCompiler } from "./compiler";

const executable = process.env.LUMIERE_EXECUTABLE;

test("reads diagnostics from the real Lumiere compiler", { skip: !executable }, async () => {
  const compiler = new LumiereCompiler(executable!);
  const result = await compiler.check("soit = 1\nsoit = 2\n", "/tmp/editor-main.lum");

  assert.equal(result.protocolVersion, 1);
  assert.equal(result.source, "/tmp/editor-main.lum");
  assert.equal(result.diagnostics.length, 2);
  assert.equal(result.diagnostics[0].code, "LUM-P0001");
});

test("reads hover information from the real Lumiere compiler", { skip: !executable }, async () => {
  const compiler = new LumiereCompiler(executable!);
  const source = "fonction doubler(x: Entier) -> Entier { retourne x * 2 }\ndoubler(4)\n";
  const result = await compiler.inspect(source, "/tmp/editor-main.lum", source.lastIndexOf("doubler"));

  assert.equal(result.protocolVersion, 1);
  assert.equal(result.inspection?.label, "doubler");
  assert.equal(result.inspection?.detail, "fonction doubler(x: Entier) -> Entier");
});
