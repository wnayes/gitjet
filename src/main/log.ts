import { BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { exec } from "node:child_process";
import { RevisionDataArgs } from "../shared/GitTypes";
import { loadRevisionData, loadRevisionList } from "./git";

let mainWindow: BrowserWindow;

const repoPath = "/home/wnayes/code/TypeScript";
const branch = "main";

export function launchLogWindow() {
  ipcMain.on("ready", () => {
    mainWindow.webContents.send("repositoryInfo", {
      repository: repoPath,
      worktree: repoPath,
      branch,
    });

    loadRevisionList(repoPath, branch, (args) => {
      mainWindow.webContents.send("revisions", args);
    });
  });

  ipcMain.on("loadRevisionData", (e, revisions: string[]) => {
    const datas: RevisionDataArgs["data"] = {};
    const promises = revisions.map((revision) =>
      loadRevisionData(repoPath, revision).then((data) => {
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
    exec(
      `git -C "${repoPath}" difftool -g -y ${revision}^ ${revision} -- ${path}`,
      (error, stdout, stderr) => {
        if (error || stderr) {
          console.error(error, stderr);
        }
      }
    );
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
