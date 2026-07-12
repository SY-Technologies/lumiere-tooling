const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const extensionRoot = path.resolve(__dirname, "..");

test("registers Lumiere files and its TextMate grammar", () => {
  const manifest = readJson("package.json");
  const grammar = readJson("syntaxes/lumiere.tmLanguage.json");

  assert.deepEqual(manifest.contributes.languages[0].extensions, [".lum"]);
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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(extensionRoot, relativePath), "utf8"));
}
