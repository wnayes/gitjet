import { app } from "electron";
import { stat } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import {
  initializeRevertCommit,
  initializeShowLogForCommit,
  launchLogWindow,
} from "./log";
import {
  getCurrentBranch,
  getGitFolderPath,
  getWorkingCopyRoot,
  isPathWithinGitRepository,
} from "./git";
import { getDirectory, removeTrailingSlashes } from "../shared/paths";
import { handleSquirrelSetup } from "./squirrel";
import { launchBlameWindow } from "./blame";
import { initializeContextMenuSupport } from "./ContextMenu";
import { initializeLaunchDiffViewerSupport } from "./diff";

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

  initializeContextMenuSupport();
  initializeLaunchDiffViewerSupport();
  initializeShowLogForCommit();
  initializeRevertCommit();

  const mode = args[0];
  switch (mode) {
    case "blame":
      await startBlameMode(args.slice(1));
      break;

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

async function startBlameMode(args: string[]): Promise<void> {
  let filePath: string;
  let revision: string | null = null;
  let startingLine = 1;

  if (args.length === 0) {
    console.error("One or more blame arguments must be passed, exiting.");
    process.exit(1);
  }

  let foundOptionalParam: boolean;
  do {
    foundOptionalParam = false;

    if (args[0] === "-L") {
      const lineArg = parseInt(args[1], 10);
      if (Number.isNaN(lineArg)) {
        console.error(`Unrecognized command line parameter: -L ${args[1]}`);
        startingLine = 1;
      } else {
        startingLine = lineArg;
      }
      args = args.slice(2);
      foundOptionalParam = true;
    }
  } while (foundOptionalParam);

  if (args.length === 2) {
    // <revision> <filepath>
    revision = args[0];
    filePath = args[1];
  } else if (args.length === 1) {
    // Only parameter is a file path.
    filePath = args[0];
  } else {
    console.error(`Unrecognized command line arguments, exiting.`);
    process.exit(1);
  }

  if (!isAbsolute(filePath)) {
    filePath = resolve(join(getCurrentWorkingDirectory(), filePath));
  }

  const filePathStat = await stat(filePath);
  const fileDirectory = getDirectory(filePath);
  if (!filePathStat.isFile() || !fileDirectory) {
    console.error("Unexpected input, exiting.");
    process.exit(1);
  }

  if (!(await isPathWithinGitRepository(fileDirectory))) {
    console.error("Not within a git repository, exiting.");
    process.exit(1);
  }

  const worktreePath = await getWorkingCopyRoot(fileDirectory);
  const repoPath = await getGitFolderPath(worktreePath);

  launchBlameWindow({
    repoPath,
    worktreePath,
    filePath,
    revision,
    startingLine,
  });
}

async function startLogMode(args: string[]): Promise<void> {
  let worktreePath: string;
  let filePath: string | null = null;
  let branch: string;

  if (args.length === 0) {
    // Assume the current working directory is the path of interest.
    worktreePath = getCurrentWorkingDirectory();
  } else {
    // Only parameter is a working copy path or a file path.
    worktreePath = args[0];

    if (!isAbsolute(worktreePath)) {
      worktreePath = resolve(join(getCurrentWorkingDirectory(), worktreePath));
    }
  }

  worktreePath = removeTrailingSlashes(worktreePath);

  if (!(await isPathWithinGitRepository(worktreePath))) {
    console.error("Not within a git repository, exiting.");
    process.exit(1);
  }

  const worktreeRoot = await getWorkingCopyRoot(worktreePath);
  if (worktreeRoot !== worktreePath) {
    filePath = worktreePath;
  }
  worktreePath = worktreeRoot;

  const repoPath = await getGitFolderPath(worktreePath);

  if (args.length === 2) {
    branch = args[1];
  } else {
    branch = await getCurrentBranch(worktreePath);
  }

  launchLogWindow(repoPath, worktreePath, filePath, branch);
}

function getCurrentWorkingDirectory(): string {
  const cwd = process.cwd();

  // If we run from a git alias, we really want cwd + GIT_PREFIX.
  const gitPrefix = process.env["GIT_PREFIX"];
  if (gitPrefix) {
    return resolve(join(cwd, gitPrefix));
  }

  return cwd;
}
