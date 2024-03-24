import { BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { spawn, exec } from "node:child_process";
import {
  GitFileChange,
  GitFileChangeType,
  gitFileChangeTypeStringToEnum,
  GitRevisionData,
  RevisionDataArgs,
} from "../shared/GitTypes";
import { loadRevisionData } from "./git";

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

    const revlist = spawn("git", [
      "-C",
      repoPath,
      "rev-list",
      "--first-parent",
      branch,
    ]);

    let sentSome = false;

    revlist.stdout.on("data", (data) => {
      //console.log(`stdout: ${data}`);
      const revisions = data.toString().split("\n");
      revisions.pop(); // Blank line.
      mainWindow.webContents.send("revisions", {
        revisions: revisions,
        incremental: sentSome,
        allLoaded: false,
      });
      sentSome = true;
    });

    revlist.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    revlist.on("close", (code) => {
      mainWindow.webContents.send("revisions", {
        revisions: [],
        incremental: true,
        allLoaded: true,
      });
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
