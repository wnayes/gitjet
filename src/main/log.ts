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

let mainWindow: BrowserWindow;

export function launchLogWindow(
  repoPath: string,
  worktreePath: string,
  filePath: string | null | undefined,
  branch: string
) {
  let ready = false;
  const logDataCache = new LogDataCache(worktreePath, filePath, branch);
  let searchInstance: ISearchInstance | null | undefined;

  ipcMain.on(IPCChannels.Ready, () => {
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
  });

  ipcMain.handle(
    IPCChannels.LoadRevisionData,
    async (e, startIndex: number, count: number) => {
      const datas = await logDataCache.loadRevisionDataRange(startIndex, count);
      mainWindow.webContents.send(IPCChannels.RevisionData, {
        startIndex,
        data: datas,
      });
      return true;
    }
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

  ipcMain.on(IPCChannels.Search, (e, searchText: string) => {
    if (searchInstance) {
      searchInstance.stop();
      searchInstance = null;
    }
    initSearchInstance(searchText, false);
  });

  ipcMain.on(IPCChannels.SearchPause, (e) => {
    if (searchInstance) {
      searchInstance.stop();
    }
  });

  ipcMain.on(IPCChannels.SearchResume, (e) => {
    if (searchInstance) {
      initSearchInstance(searchInstance.searchText, true);
    }
  });

  ipcMain.on(
    IPCChannels.LaunchDiffTool,
    async (e, revision: string, path: string) => {
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
