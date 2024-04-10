import { BrowserWindow, WebContents, ipcMain } from "electron";
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

interface LogWindow {
  onReady(): void;
  onLoadRevisionData(
    startIndex: number,
    count: number
  ): Promise<boolean> | void;
  onSearch(searchText: string): void;
  onSearchPause(): void;
  onSearchResume(): void;
  onLaunchDiffTool(revision: string, path: string): void;
  onShowLogForCommit(commit: string): void;
}

const _logWindows: Map<WebContents, LogWindow> = new Map();

ipcMain.on(IPCChannels.Ready, (e: Electron.IpcMainInvokeEvent) => {
  const win = _logWindows.get(e.sender);
  if (win) {
    win.onReady();
  }
});

ipcMain.handle(
  IPCChannels.LoadRevisionData,
  (e: Electron.IpcMainInvokeEvent, startIndex: number, count: number) => {
    const win = _logWindows.get(e.sender);
    if (win) {
      return win.onLoadRevisionData(startIndex, count);
    }
  }
);

ipcMain.on(
  IPCChannels.Search,
  (e: Electron.IpcMainInvokeEvent, searchText: string) => {
    const win = _logWindows.get(e.sender);
    if (win) {
      win.onSearch(searchText);
    }
  }
);

ipcMain.on(IPCChannels.SearchPause, (e: Electron.IpcMainInvokeEvent) => {
  const win = _logWindows.get(e.sender);
  if (win) {
    win.onSearchPause();
  }
});

ipcMain.on(IPCChannels.SearchResume, (e: Electron.IpcMainInvokeEvent) => {
  const win = _logWindows.get(e.sender);
  if (win) {
    win.onSearchResume();
  }
});

ipcMain.on(
  IPCChannels.LaunchDiffTool,
  (e: Electron.IpcMainInvokeEvent, revision: string, path: string) => {
    const win = _logWindows.get(e.sender);
    if (win) {
      win.onLaunchDiffTool(revision, path);
    }
  }
);

ipcMain.on(
  IPCChannels.ShowLogForCommit,
  (e: Electron.IpcMainInvokeEvent, commit: string) => {
    const win = _logWindows.get(e.sender);
    if (win) {
      win.onShowLogForCommit(commit);
    }
  }
);

export function launchLogWindow(
  repoPath: string,
  worktreePath: string,
  filePath: string | null | undefined,
  branch: string
): void {
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

  const onReady = () => {
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

  const onLoadRevisionData = async (startIndex: number, count: number) => {
    const datas = await logDataCache.loadRevisionDataRange(startIndex, count);
    mainWindow.webContents.send(IPCChannels.RevisionData, {
      startIndex,
      data: datas,
    });
    return true;
  };

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

  const onSearch = (searchText: string) => {
    if (searchInstance) {
      searchInstance.stop();
      searchInstance = null;
    }
    initSearchInstance(searchText, false);
  };

  const onSearchPause = () => {
    if (searchInstance) {
      searchInstance.stop();
    }
  };

  const onSearchResume = () => {
    if (searchInstance) {
      initSearchInstance(searchInstance.searchText, true);
    }
  };

  const onLaunchDiffTool = async (revision: string, path: string) => {
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

  const onShowLogForCommit = (commit: string) => {
    launchLogWindow(repoPath, worktreePath, filePath, commit);
  };

  const { webContents } = mainWindow;
  _logWindows.set(webContents, {
    onReady,
    onLoadRevisionData,
    onSearch,
    onSearchPause,
    onSearchResume,
    onLaunchDiffTool,
    onShowLogForCommit,
  });

  mainWindow.on("closed", () => {
    _logWindows.delete(webContents);
  });
}
