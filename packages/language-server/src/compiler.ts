import { ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import { CheckResult, parseCheckResult } from "./protocol";

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
    this.cancel();
    return new Promise((resolve, reject) => {
      const child = spawn(
        this.executable,
        ["check", "--format=json", "--stdin", "--source-path", sourcePath],
        { stdio: "pipe" },
      );
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
        if (exitCode !== 0 && exitCode !== 1) {
          reject(new Error(stderr.trim() || `Lumiere check exited with status ${exitCode}`));
          return;
        }
        try {
          resolve(parseCheckResult(stdout));
        } catch (error) {
          reject(error);
        }
      });
      child.stdin.end(source);
    });
  }
}
