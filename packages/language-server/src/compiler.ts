import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { CheckResult, InspectionResult, parseCheckResult, parseInspectionResult } from "./protocol";

/** Runs authoritative source analysis through the local Lumiere executable. */
export class LumiereCompiler {
  private activeProcess: ChildProcessWithoutNullStreams | undefined;

  /** Creates an adapter for an executable path or command available on PATH. */
  public constructor(private executable: string) {}

  /** Selects the executable used by subsequent analysis requests. */
  public setExecutable(executable: string): void {
    this.executable = executable;
  }

  /** Terminates this instance's active analysis process, if one exists. */
  public cancel(): void {
    this.activeProcess?.kill();
    this.activeProcess = undefined;
  }

  /**
   * Analyzes an exact source buffer and validates the compiler's JSON response.
   *
   * Starting a request cancels this instance's previous request. Exit statuses
   * 0 and 1 represent valid analysis results; process failures, malformed JSON,
   * and unsupported protocol versions reject the returned promise.
   *
   * @param source Unsaved or saved source text sent through stdin.
   * @param sourcePath Logical path used for diagnostics and import resolution.
   */
  public check(source: string, sourcePath: string): Promise<CheckResult> {
    return this.request(
      ["check", "--format=json", "--stdin", "--source-path", sourcePath],
      source,
      new Set([0, 1]),
      parseCheckResult,
    );
  }

  /** Requests compiler-owned symbol information at a UTF-8 byte offset. */
  public inspect(source: string, sourcePath: string, byteOffset: number): Promise<InspectionResult> {
    return this.request(
      ["inspect", "--format=json", "--stdin", "--source-path", sourcePath, "--offset", String(byteOffset)],
      source,
      new Set([0]),
      parseInspectionResult,
    );
  }

  /** Runs one cancellable compiler request and validates its complete response. */
  private request<T>(
    args: string[],
    source: string,
    acceptedExitCodes: ReadonlySet<number>,
    parse: (output: string) => T,
  ): Promise<T> {
    this.cancel();
    return new Promise((resolve, reject) => {
      const child = spawn(this.executable, args, { stdio: "pipe" });
      this.activeProcess = child;
      let stdout = "";
      let stderr = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });
      child.on("error", reject);
      child.on("close", (exitCode, signal) => {
        if (this.activeProcess === child) {
          this.activeProcess = undefined;
        }
        if (signal !== null) {
          reject(new Error("Lumiere analysis was cancelled"));
          return;
        }
        if (exitCode === null || !acceptedExitCodes.has(exitCode)) {
          reject(new Error(stderr.trim() || `Lumiere exited with status ${exitCode}`));
          return;
        }
        try {
          resolve(parse(stdout));
        } catch (error) {
          reject(error);
        }
      });
      child.stdin.end(source);
    });
  }
}
