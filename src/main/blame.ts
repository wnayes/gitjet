import { BrowserWindow, WebContents, ipcMain } from "electron";
import path from "node:path";
import { getFileContentsAtRevision, loadBlameData } from "./git";
import { BlameData, BlameIPCChannels } from "../shared/ipc";

declare global {
  const BLAME_WINDOW_VITE_DEV_SERVER_URL: string;
  const BLAME_WINDOW_VITE_NAME: string;
}

interface BlameWindow {
  onReady(): void;
}

const _blameWindows: Map<WebContents, BlameWindow> = new Map();

ipcMain.on(
  BlameIPCChannels.BlameWindowReady,
  (e: Electron.IpcMainInvokeEvent) => {
    const win = _blameWindows.get(e.sender);
    if (win) {
      win.onReady();
    }
  }
);

export function launchBlameWindow(
  repoPath: string,
  worktreePath: string,
  filePath: string,
  revision: string | null | undefined
): void {
  const blameWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(path.join(__dirname, "blamePreload.js")),
    },
  });

  if (BLAME_WINDOW_VITE_DEV_SERVER_URL) {
    blameWindow.loadURL(
      `${BLAME_WINDOW_VITE_DEV_SERVER_URL}/src/renderer/blame/index.html`
    );
  } else {
    blameWindow.loadFile(
      path.join(
        __dirname,
        "..",
        "renderer",
        BLAME_WINDOW_VITE_NAME,
        "src",
        "renderer",
        "blame",
        "index.html"
      )
    );
  }

  let ready = false;
  let fileContents: string | undefined;
  getFileContentsAtRevision(repoPath, filePath, revision ?? "HEAD").then(
    (text) => {
      fileContents = text;
      if (ready) {
        blameWindow.webContents.send(
          BlameIPCChannels.BlameFileContents,
          fileContents
        );
      }
    }
  );

  const blameDataToSend: BlameData[] = [];
  loadBlameData(worktreePath, filePath, revision, (blameData) => {
    console.log(blameData);
    if (ready) {
      blameWindow.webContents.send(BlameIPCChannels.BlameData, blameData);
    } else {
      blameDataToSend.push(...blameData);
    }
  });

  const onReady = () => {
    ready = true;
    if (typeof fileContents === "string") {
      blameWindow.webContents.send(
        BlameIPCChannels.BlameFileContents,
        fileContents
      );
    }
    if (blameDataToSend.length > 0) {
      blameWindow.webContents.send(BlameIPCChannels.BlameData, blameDataToSend);
    }
  };

  const { webContents } = blameWindow;
  _blameWindows.set(webContents, {
    onReady,
  });

  blameWindow.on("closed", () => {
    _blameWindows.delete(webContents);
  });
}
