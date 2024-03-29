import { BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { launchDiffTool } from "./git";
import { LogDataCache } from "./LogDataCache";
import {
  IPCChannels,
  SearchProgressData,
  SearchResultData,
} from "../shared/ipc";
import { RevisionCountArgs } from "../shared/GitTypes";

let mainWindow: BrowserWindow;

export function launchLogWindow(
  repoPath: string,
  worktreePath: string,
  filePath: string | null | undefined,
  branch: string
) {
  let ready = false;
  const logDataCache = new LogDataCache(worktreePath, filePath, branch);

  ipcMain.on(IPCChannels.Ready, () => {
    ready = true;

    mainWindow.webContents.send(IPCChannels.RepositoryInfo, {
      repository: repoPath,
      worktree: worktreePath,
      branch,
    });

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
  });

  ipcMain.on(
    IPCChannels.LoadRevisionData,
    (e, startIndex: number, count: number) => {
      logDataCache.loadRevisionDataRange(startIndex, count).then((datas) => {
        mainWindow.webContents.send(IPCChannels.RevisionData, {
          startIndex,
          data: datas,
        });
      });
    }
  );

  ipcMain.on(IPCChannels.Search, (e, searchText: string) => {
    logDataCache.search({
      searchText,
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
  });

  ipcMain.on(
    IPCChannels.LaunchDiffTool,
    (e, revision: string, path: string) => {
      launchDiffTool(worktreePath, revision, path);
    }
  );

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(path.join(__dirname, "..", "preload", "dist.js")),
    },
  });

  mainWindow.loadFile(path.join("src", "renderer", "log", "index.html"));

  // mainWindow.webContents.openDevTools()
}
