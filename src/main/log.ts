import { BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { getGitReferences, getNullObjectHash, launchDiffTool } from "./git";
import { ISearchInstance, LogDataCache } from "./LogDataCache";
import {
  IPCChannels,
  RepositoryInfoArgs,
  SearchProgressData,
  SearchResultData,
} from "../shared/ipc";
import { RevisionCountArgs } from "../shared/GitTypes";

declare global {
  const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
  const MAIN_WINDOW_VITE_NAME: string;
}

export function launchLogWindow(
  repoPath: string,
  worktreePath: string,
  filePath: string | null | undefined,
  branch: string
) {
  let ready = false;
  const logDataCache = new LogDataCache(
    repoPath,
    worktreePath,
    filePath,
    branch
  );
  let searchInstance: ISearchInstance | null | undefined;

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(path.join(__dirname, "preload.js")),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(
      `${MAIN_WINDOW_VITE_DEV_SERVER_URL}/src/renderer/log/index.html`
    );
  } else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        "..",
        "renderer",
        MAIN_WINDOW_VITE_NAME,
        "src",
        "renderer",
        "log",
        "index.html"
      )
    );
  }

  const onReady = (e: Electron.IpcMainInvokeEvent) => {
    if (e.sender !== mainWindow?.webContents) {
      return;
    }

    ready = true;

    const repositoryInfo: RepositoryInfoArgs = {
      repository: repoPath,
      worktree: worktreePath,
      filePath,
      branch,
    };
    mainWindow.webContents.send(IPCChannels.RepositoryInfo, repositoryInfo);

    const revisionsAllLoaded = logDataCache.revisionsFullyLoaded();
    mainWindow.webContents.send(IPCChannels.Revisions, {
      revisionCount: logDataCache.getRevisionCount(),
      allLoaded: revisionsAllLoaded,
    } as RevisionCountArgs);
    if (!revisionsAllLoaded) {
      logDataCache.onGotRevisions((args) => {
        mainWindow.webContents.send(IPCChannels.Revisions, {
          revisionCount: logDataCache.getRevisionCount(),
          allLoaded: args.allLoaded,
        } as RevisionCountArgs);
      });
    }

    setTimeout(() => {
      getGitReferences(worktreePath).then((map) => {
        mainWindow.webContents.send(IPCChannels.Refs, map);
      });
    }, 16);
  };
  ipcMain.on(IPCChannels.Ready, onReady);
  mainWindow.on("closed", () => ipcMain.off(IPCChannels.Ready, onReady));

  const onLoadRevisionData = async (
    e: Electron.IpcMainInvokeEvent,
    startIndex: number,
    count: number
  ) => {
    if (e.sender !== mainWindow?.webContents) {
      return;
    }

    const datas = await logDataCache.loadRevisionDataRange(startIndex, count);
    mainWindow.webContents.send(IPCChannels.RevisionData, {
      startIndex,
      data: datas,
    });
    return true;
  };
  ipcMain.handle(IPCChannels.LoadRevisionData, onLoadRevisionData);
  mainWindow.on("closed", () =>
    ipcMain.off(IPCChannels.LoadRevisionData, onLoadRevisionData)
  );

  function initSearchInstance(searchText: string, resuming: boolean) {
    searchInstance = logDataCache.search({
      searchText,
      resuming,
      onResult: (revisionMatch) => {
        const resultPayload: SearchResultData = {
          searchText,
          revisionMatch,
        };
        mainWindow.webContents.send(IPCChannels.SearchResult, resultPayload);
      },
      onProgress: (currentRevision) => {
        const progressPayload: SearchProgressData = {
          searchText,
          currentRevision,
        };
        mainWindow.webContents.send(
          IPCChannels.SearchProgress,
          progressPayload
        );
      },
    });
  }

  const onSearch = (e: Electron.IpcMainInvokeEvent, searchText: string) => {
    if (e.sender !== mainWindow?.webContents) {
      return;
    }

    if (searchInstance) {
      searchInstance.stop();
      searchInstance = null;
    }
    initSearchInstance(searchText, false);
  };
  ipcMain.on(IPCChannels.Search, onSearch);
  mainWindow.on("closed", () => ipcMain.off(IPCChannels.Search, onSearch));

  const onSearchPause = (e: Electron.IpcMainInvokeEvent) => {
    if (e.sender !== mainWindow?.webContents) {
      return;
    }

    if (searchInstance) {
      searchInstance.stop();
    }
  };
  ipcMain.on(IPCChannels.SearchPause, onSearchPause);
  mainWindow.on("closed", () =>
    ipcMain.off(IPCChannels.SearchPause, onSearchPause)
  );

  const onSearchResume = (e: Electron.IpcMainInvokeEvent) => {
    if (e.sender !== mainWindow?.webContents) {
      return;
    }

    if (searchInstance) {
      initSearchInstance(searchInstance.searchText, true);
    }
  };
  ipcMain.on(IPCChannels.SearchResume, onSearchResume);
  mainWindow.on("closed", () =>
    ipcMain.off(IPCChannels.SearchResume, onSearchResume)
  );

  const onLaunchDiffTool = async (
    e: Electron.IpcMainInvokeEvent,
    revision: string,
    path: string
  ) => {
    if (e.sender !== mainWindow?.webContents) {
      return;
    }

    if (
      logDataCache.getRevisionAtIndex(logDataCache.getRevisionCount() - 1) ===
      revision
    ) {
      // We need to use special arguments for the very first revision diff.
      const nullHash = await getNullObjectHash(worktreePath);
      launchDiffTool(worktreePath, nullHash, revision, path);
    } else {
      launchDiffTool(worktreePath, null, revision, path);
    }
  };
  ipcMain.on(IPCChannels.LaunchDiffTool, onLaunchDiffTool);
  mainWindow.on("closed", () =>
    ipcMain.off(IPCChannels.LaunchDiffTool, onLaunchDiffTool)
  );
}
