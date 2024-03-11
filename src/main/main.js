const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { spawn } = require("node:child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadFile(path.join("src", "renderer", "index.html"));

  // mainWindow.webContents.openDevTools()
}

function setup() {
  ipcMain.on("ready", () => {
    const repoPath = "/home/wnayes/code/TypeScript";
    const branch = "main";
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
