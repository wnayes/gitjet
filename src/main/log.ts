import { BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { exec, spawn } from "node:child_process";
import { RevisionDataArgs } from "../shared/GitTypes";
import { launchDiffTool, loadRevisionData, loadRevisionList } from "./git";

let mainWindow: BrowserWindow;

export function launchLogWindow(
  repoPath: string,
  worktreePath: string,
  filePath: string | null | undefined,
  branch: string
) {
  let ready = false;
  let messagesToSend: [string, ...args: any[]][] = [];

  function startRevisionListLoad() {
    loadRevisionList(worktreePath, branch, (args) => {
      if (!ready) {
        messagesToSend.push(["revisions", args]);
      } else {
        mainWindow.webContents.send("revisions", args);
      }
    });
  }

  // Start the revision list load immediately, and send any data once the
  // browser window renders.
  startRevisionListLoad();

  ipcMain.on("ready", () => {
    const wasAlreadyReady = ready;
    ready = true;

    mainWindow.webContents.send("repositoryInfo", {
      repository: repoPath,
      worktree: worktreePath,
      branch,
    });

    for (const messageToSend of messagesToSend) {
      mainWindow.webContents.send(...messageToSend);
    }
    messagesToSend = [];

    // For when the browser window reloads.
    if (wasAlreadyReady) {
      startRevisionListLoad();
    }
  });

  ipcMain.on("loadRevisionData", (e, revisions: string[]) => {
    const datas: RevisionDataArgs["data"] = {};
    const promises = revisions.map((revision) =>
      loadRevisionData(worktreePath, revision).then((data) => {
        datas[revision] = data;
      })
    );
    Promise.all(promises).then(() => {
      mainWindow.webContents.send("revisionData", {
        data: datas,
      });
    });
  });

  ipcMain.on("launchDiffTool", (e, revision: string, path: string) => {
    launchDiffTool(worktreePath, revision, path);
  });

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(
        path.join(__dirname, "..", "preload", "preload.js")
      ),
    },
  });

  mainWindow.loadFile(path.join("src", "renderer", "log", "index.html"));

  // mainWindow.webContents.openDevTools()
}
