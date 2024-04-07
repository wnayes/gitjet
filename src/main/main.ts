import { app } from "electron";
import { stat } from "node:fs/promises";
import { launchLogWindow } from "./log";
import {
  getCurrentBranch,
  getGitFolderPath,
  getWorkingCopyRoot,
  isPathWithinGitRepository,
} from "./git";
import { getDirectory } from "../shared/paths";
import { handleSquirrelSetup } from "./squirrel";

// The Windows installer will run the main entrypoint.
// When installing, we don't start the app; we add reg keys, etc.
if (handleSquirrelSetup(() => app.quit())) {
  app.quit();
}

app.whenReady().then(async () => {
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  if (args.length === 0) {
    console.error("One or more arguments must be passed, exiting.");
    process.exit(1);
  }

  const mode = args[0];
  switch (mode) {
    case "log":
      await startLogMode(args.slice(1));
      break;

    default:
      console.error(`Unrecognized command line argument '${mode}', exiting.`);
      process.exit(1);
  }
});

app.on("window-all-closed", () => {
  app.quit();
});

async function startLogMode(args: string[]): Promise<void> {
  let worktreePath: string;
  let filePath: string | null = null;
  let branch: string;

  if (args.length === 0) {
    // Assume the current working directory is the path of interest.
    worktreePath = process.cwd();
  } else {
    // Only parameter is a working copy path or a file path.
    worktreePath = args[0];

    const worktreePathStat = await stat(worktreePath);
    if (worktreePathStat.isFile()) {
      filePath = worktreePath;
      const worktreeDir = getDirectory(worktreePath);
      if (!worktreeDir) {
        console.error("Unexpected input, exiting.");
        process.exit(1);
      }
      worktreePath = worktreeDir;
    }
  }

  if (!(await isPathWithinGitRepository(worktreePath))) {
    console.error("Not within a git repository, exiting.");
    process.exit(1);
  }

  worktreePath = await getWorkingCopyRoot(worktreePath);
  const repoPath = await getGitFolderPath(worktreePath);

  if (args.length === 2) {
    branch = args[1];
  } else {
    branch = await getCurrentBranch(worktreePath);
  }

  launchLogWindow(repoPath, worktreePath, filePath, branch);
}
