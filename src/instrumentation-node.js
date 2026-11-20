import { spawn } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const workerPath = path.join(projectRoot, "worker", "monitor.js");
const workerProcess = spawn(process.execPath, [workerPath], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});
let shuttingDown = false;

workerProcess.on("error", (error) => {
  console.error("[worker] Failed to start monitoring worker:", error);
});

workerProcess.on("exit", (code, signal) => {
  if (!shuttingDown) {
    console.error(
      `[worker] Monitoring worker exited unexpectedly (code ${code}, signal ${signal}).`
    );
  }
});

const stopWorker = () => {
  shuttingDown = true;
  if (workerProcess.exitCode === null) {
    workerProcess.kill();
  }
};

process.once("SIGINT", stopWorker);
process.once("SIGTERM", stopWorker);
process.once("exit", stopWorker);
