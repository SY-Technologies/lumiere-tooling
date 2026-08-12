import { LumiereInspection } from "./protocol";

/** Renders one compiler inspection as VS Code hover Markdown. */
export function inspectionToMarkdown(inspection: LumiereInspection): string {
  const parameters = inspection.parameters.length === 0 ? "" : [
    "**Paramètres**",
    ...inspection.parameters.map((parameter) => `- \`${parameter}\``),
  ].join("\n");

  return [
    inspection.kind ? `### ${inspection.kind}` : "",
    inspection.signature ? `\`\`\`lumiere\n${inspection.signature}\n\`\`\`` : "",
    parameters,
    inspection.returnType ? `**Retourne** \`${inspection.returnType}\`` : "",
    inspection.documentation,
  ].filter(Boolean).join("\n\n");
}
