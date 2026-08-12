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
  const source = "/** Double une valeur entière. */\n"
    + "fonction doubler(x: Entier) -> Entier { retourne x * 2 }\n"
    + "soit texte = \"bonjour\"\ntexte.majuscules()\n"
    + "doubler(4)\n";
  const byteOffsetOf = (value: string, fromEnd = false): number => {
    const characterOffset = fromEnd ? source.lastIndexOf(value) : source.indexOf(value);
    return Buffer.byteLength(source.slice(0, characterOffset));
  };
  const result = await compiler.inspect(source, "/tmp/editor-main.lum", byteOffsetOf("doubler", true));

  assert.equal(result.protocolVersion, 2);
  assert.equal(result.inspection?.label, "doubler");
  assert.equal(result.inspection?.signature, "fonction doubler(x: Entier) -> Entier");
  assert.equal(result.inspection?.documentation, "Double une valeur entière.");

  const member = await compiler.inspect(
    source, "/tmp/editor-main.lum", byteOffsetOf("majuscules", true));
  assert.equal(member.inspection?.label, "majuscules");
  assert.equal(member.inspection?.kind, "méthode");
  assert.equal(member.inspection?.signature, "majuscules() -> Texte");
  assert.ok(member.inspection?.documentation.length > 0);
});
