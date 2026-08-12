import assert from "node:assert/strict";
import test from "node:test";
import { inspectionToMarkdown } from "./hover";

test("renders declaration documentation in hover Markdown", () => {
  const markdown = inspectionToMarkdown({
    label: "doubler",
    kind: "fonction",
    signature: "fonction doubler(x: Entier) -> Entier",
    parameters: ["x: Entier"],
    returnType: "Entier",
    documentation: "Double une valeur entière.",
    range: { start: 0, end: 7 },
  });

  assert.equal(markdown, [
    "### fonction",
    "```lumiere\nfonction doubler(x: Entier) -> Entier\n```",
    "**Paramètres**\n- `x: Entier`",
    "**Retourne** `Entier`",
    "Double une valeur entière.",
  ].join("\n\n"));
});
