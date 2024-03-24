import { BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { spawn, exec } from "node:child_process";
import {
  GitFileChange,
  GitFileChangeType,
  gitFileChangeTypeStringToEnum,
  GitRevisionData,
} from "../shared/GitTypes";

let mainWindow: BrowserWindow;

const repoPath = "/home/wnayes/code/TypeScript";
const branch = "main";

export function launchLogWindow() {
  ipcMain.on("ready", () => {
    mainWindow.webContents.send("setBranch", branch);

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
      });
      sentSome = true;
    });

    revlist.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    revlist.on("close", (code) => {
      console.log(`rev-list process exited with code ${code}`);
    });
  });

  ipcMain.on("loadRevisionData", (e, revisions: string[]) => {
    revisions.forEach((revision) => {
      exec(
        `git -C "${repoPath}" show --format=format:"%an%x00%ae%x00%aI%x00%B%x00" --name-status --no-abbrev ${revision}`,
        function (error, stdout, stderr) {
          const lines = stdout.split("\x00");
          const data: GitRevisionData = {
            author: lines[0],
            authorEmail: lines[1],
            authorDate: lines[2],
            subject: null,
            body: null,
            changes: null,
          };
          const message = lines[3];
          const bodyBreak = message.indexOf("\n\n");
          if (bodyBreak > 0) {
            data.subject = message.substring(0, bodyBreak);
            data.body = message.substring(bodyBreak + 2);
          } else {
            data.subject = message;
          }

          const changes: GitFileChange[] = [];
          const changeLines = lines[4].split("\n");
          for (let i = 1; i < changeLines.length - 1; i++) {
            const line = changeLines[i];
            const typeString = line[0];
            const change: GitFileChange = {
              type: gitFileChangeTypeStringToEnum(typeString),
              path: line.substring(1).trimStart(),
            };
            if (change.type === GitFileChangeType.Rename) {
              // These show up as `017 old-path new-path`.
              // Not sure what the numbers refer to.
              const pieces = line.replace(/\s+/g, "\x00").split("\x00");
              change.path = pieces[pieces.length - 2];
              change.newPath = pieces[pieces.length - 1];
            } else {
              change.path = line.substring(1).trimStart();
            }
            changes.push(change);
          }
          data.changes = changes;

          const args = {
            revision: revision,
            data: data,
          };
          mainWindow.webContents.send("revisionData", args);
        }
      );
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
