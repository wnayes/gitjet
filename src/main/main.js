const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { spawn, exec } = require("node:child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join("src", "renderer", "index.html"));

  // mainWindow.webContents.openDevTools()
}

const repoPath = "/home/wnayes/code/TypeScript";
const branch = "main";

const revisionDataLoaded = new Set();

function setup() {
  ipcMain.on("ready", () => {
    mainWindow.webContents.send("setBranch", branch);

    const revlist = spawn("git", ["-C", repoPath, "rev-list", branch]);

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

  ipcMain.on("loadRevisionData", (e, revisions) => {
    revisions.forEach((revision) => {
      // Prevent repeat git calls.
      if (revisionDataLoaded.has(revision)) {
        return;
      }
      revisionDataLoaded.add(revision);

      exec(
        `git -C "${repoPath}" cat-file -p ${revision}`,
        function (error, stdout, stderr) {
          const lines = stdout.split("\n");
          const data = {
            author: null,
            authorDate: null,
            message: null,
          };
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (
              line.startsWith("tree ") ||
              line.startsWith("parent ") ||
              line.startsWith("committer ")
            ) {
              continue;
            }
            if (line.startsWith("author ")) {
              const emailEndIndex = line.indexOf(">");
              data.author = line.substring("author ".length, emailEndIndex + 1);
              data.authorDate = line.substring(emailEndIndex + 2);
              continue;
            }
            if (!line) {
              data.message = lines.slice(i + 1).join("\n");
              break;
            }
          }
          const args = {
            revision: revision,
            data: data,
          };
          mainWindow.webContents.send("revisionData", args);
        }
      );
    });
  });
}

app.whenReady().then(() => {
  setup();
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
