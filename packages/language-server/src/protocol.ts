export const SUPPORTED_PROTOCOL_VERSION = 1;

export type LumiereSeverity = "error" | "warning" | "information" | "hint";

export interface LumiereDiagnostic {
  /** Stable compiler diagnostic identifier. */
  code: string;
  severity: LumiereSeverity;
  message: string;
  /** Half-open zero-based UTF-8 byte range. */
  range: {
    start: number;
    end: number;
  };
  line: number;
  column: number;
}

export interface CheckResult {
  protocolVersion: number;
  source: string;
  diagnostics: LumiereDiagnostic[];
}

export interface InspectionResult {
  protocolVersion: number;
  inspection: {
    label: string;
    detail: string;
    range: { start: number; end: number };
  } | null;
}

/** Parses and validates one `lumiere inspect --format=json` response. */
export function parseInspectionResult(output: string): InspectionResult {
  const parsed: unknown = JSON.parse(output);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Lumiere returned an invalid inspection response");
  }
  const result = parsed as Partial<InspectionResult>;
  if (result.protocolVersion !== SUPPORTED_PROTOCOL_VERSION || !isInspection(result.inspection)) {
    throw new Error("Lumiere returned an invalid inspection response");
  }
  return result as InspectionResult;
}

function isInspection(value: unknown): value is InspectionResult["inspection"] {
  if (value === null) {
    return true;
  }
  if (typeof value !== "object") {
    return false;
  }
  const inspection = value as NonNullable<InspectionResult["inspection"]>;
  return typeof inspection.label === "string" && typeof inspection.detail === "string" &&
    typeof inspection.range?.start === "number" && typeof inspection.range.end === "number";
}

/**
 * Parses and validates one complete `lumiere check --format=json` response.
 *
 * @throws SyntaxError when output is not JSON.
 * @throws Error when the payload shape or protocol version is unsupported.
 */
export function parseCheckResult(output: string): CheckResult {
  const parsed: unknown = JSON.parse(output);
  if (!isCheckResult(parsed)) {
    throw new Error("Lumiere returned an invalid diagnostic response");
  }
  if (parsed.protocolVersion !== SUPPORTED_PROTOCOL_VERSION) {
    throw new Error(
      `Unsupported Lumiere diagnostic protocol ${parsed.protocolVersion}; expected ${SUPPORTED_PROTOCOL_VERSION}`,
    );
  }
  return parsed;
}

function isCheckResult(value: unknown): value is CheckResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<CheckResult>;
  return (
    typeof candidate.protocolVersion === "number" &&
    typeof candidate.source === "string" &&
    Array.isArray(candidate.diagnostics) &&
    candidate.diagnostics.every(isDiagnostic)
  );
}

function isDiagnostic(value: unknown): value is LumiereDiagnostic {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<LumiereDiagnostic>;
  return (
    typeof candidate.code === "string" &&
    isSeverity(candidate.severity) &&
    typeof candidate.message === "string" &&
    typeof candidate.range?.start === "number" &&
    typeof candidate.range.end === "number"
  );
}

function isSeverity(value: unknown): value is LumiereSeverity {
  return value === "error" || value === "warning" || value === "information" || value === "hint";
}
