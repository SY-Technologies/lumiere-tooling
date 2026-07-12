const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const extensionRoot = path.resolve(__dirname, "..");

test("registers Lumiere files and its TextMate grammar", () => {
  const manifest = readJson("package.json");
  const grammar = readJson("syntaxes/lumiere.tmLanguage.json");

  assert.deepEqual(manifest.contributes.languages[0].extensions, [".lum"]);
  assert.equal(manifest.contributes.languages[0].icon.light, "./icons/lumiere-light.svg");
  assert.equal(manifest.contributes.languages[0].icon.dark, "./icons/lumiere-dark.svg");
  assert.ok(fs.existsSync(path.join(extensionRoot, "icons", "lumiere-light.svg")));
  assert.ok(fs.existsSync(path.join(extensionRoot, "icons", "lumiere-dark.svg")));
  assert.equal(manifest.contributes.grammars[0].scopeName, "source.lumiere");
  assert.equal(grammar.scopeName, "source.lumiere");
});

test("highlights every compiler keyword spelling", () => {
  const grammarText = fs.readFileSync(path.join(extensionRoot, "syntaxes", "lumiere.tmLanguage.json"), "utf8");
  const keywords = [
    "soit", "fixe", "fonction", "retourne", "classe", "interface", "réalise", "realise",
    "remplace", "public", "privé", "prive", "si", "sinon", "pour", "chaque", "dans",
    "tant", "que", "agir", "selon", "arrêter", "arreter", "continuer", "essayer",
    "attraper", "finalement", "lancer", "vrai", "faux", "rien", "ici", "parent", "en",
    "importer", "comme", "est", "et", "ou", "non",
  ];

  for (const keyword of keywords) {
    assert.ok(grammarText.includes(keyword), `missing keyword: ${keyword}`);
  }
});

test("defines scopes for common source constructs", () => {
  const grammar = readJson("syntaxes/lumiere.tmLanguage.json");
  const grammarText = JSON.stringify(grammar);

  for (const repositoryName of ["declarations", "types", "calls", "members", "imports"]) {
    assert.ok(grammar.repository[repositoryName], `missing grammar repository: ${repositoryName}`);
  }
  for (const scope of [
    "variable.other.definition.lumiere",
    "variable.parameter.lumiere",
    "support.type.primitive.lumiere",
    "entity.name.function.call.lumiere",
    "variable.other.property.lumiere",
    "entity.name.namespace.lumiere",
  ]) {
    assert.ok(grammarText.includes(scope), `missing scope: ${scope}`);
  }
});

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(extensionRoot, relativePath), "utf8"));
}
