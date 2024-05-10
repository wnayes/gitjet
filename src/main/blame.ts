import { BrowserWindow, WebContents, ipcMain } from "electron";
import path from "node:path";
import { getFileContentsAtRevision, loadBlameData } from "./git";
import { BlameData, BlameIPCChannels, RepositoryInfoArgs } from "../shared/ipc";
import { getRevisionDataCache } from "./RevisionDataCache";

declare global {
  const BLAME_WINDOW_VITE_DEV_SERVER_URL: string;
  const BLAME_WINDOW_VITE_NAME: string;
}

interface BlameWindow {
  onBlameOtherRevision(revision: string): void;
  onLoadRevisionData(revision: string): void;
  onReady(): void;
}

const _blameWindows: Map<WebContents, BlameWindow> = new Map();

ipcMain.on(
  BlameIPCChannels.BlameOtherRevision,
  (e: Electron.IpcMainInvokeEvent, revision: string) => {
    const win = _blameWindows.get(e.sender);
    if (win) {
      win.onBlameOtherRevision(revision);
    }
  }
);

ipcMain.on(
  BlameIPCChannels.BlameLoadRevisionData,
  (e: Electron.IpcMainInvokeEvent, revision: string) => {
    const win = _blameWindows.get(e.sender);
    if (win) {
      win.onLoadRevisionData(revision);
    }
  }
);

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
  getFileContentsAtRevision(worktreePath, filePath, revision ?? "HEAD").then(
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

  const allBlameData: BlameData[] = [];
  const blameDataToSend: BlameData[] = [];
  loadBlameData(worktreePath, filePath, revision, (blameData) => {
    if (ready) {
      blameWindow.webContents.send(BlameIPCChannels.BlameData, blameData);
    } else {
      blameDataToSend.push(...blameData);
    }
    allBlameData.push(...blameData);
  });

  const onReady = () => {
    // A reload of the browser, send all blame data again.
    if (ready) {
      blameWindow.webContents.send(BlameIPCChannels.BlameData, allBlameData);
    }

    ready = true;

    const repositoryInfo: RepositoryInfoArgs = {
      repository: repoPath,
      worktree: worktreePath,
      filePath,
      branch: "",
    };
    blameWindow.webContents.send(
      BlameIPCChannels.BlameRepositoryInfo,
      repositoryInfo
    );

    if (typeof fileContents === "string") {
      blameWindow.webContents.send(
        BlameIPCChannels.BlameFileContents,
        fileContents
      );
    }

    if (blameDataToSend.length > 0) {
      blameWindow.webContents.send(BlameIPCChannels.BlameData, blameDataToSend);
      blameDataToSend.length = 0;
    }
  };

  const onBlameOtherRevision = (revision: string) => {
    launchBlameWindow(repoPath, worktreePath, filePath, revision);
  };

  const onLoadRevisionData = async (revision: string) => {
    const revDataCache = getRevisionDataCache(repoPath);
    const data = await revDataCache.loadRevisionData(revision);
    blameWindow.webContents.send(BlameIPCChannels.BlameRevisionData, data);
  };

  const { webContents } = blameWindow;
  _blameWindows.set(webContents, {
    onBlameOtherRevision,
    onLoadRevisionData,
    onReady,
  });

  blameWindow.on("closed", () => {
    _blameWindows.delete(webContents);
  });
}
