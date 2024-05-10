import { contextBridge, ipcRenderer } from "electron";
import { CommonIPCChannels, type GitJetCommonBridge } from "../shared/ipc";
import { IMenuItemOptions } from "../shared/ContextMenu";

const bridge: GitJetCommonBridge = {
  showContextMenu: (
    menuItems: IMenuItemOptions[],
    callback: (choice: number) => void
  ) => {
    ipcRenderer
      .invoke(CommonIPCChannels.ShowContextMenu, menuItems)
      .then((choice) => {
        callback(choice);
      });
  },

  showLogForCommit: (repoPath, worktreePath, filePath, commit) => {
    ipcRenderer.send(
      CommonIPCChannels.ShowLogForCommit,
      repoPath,
      worktreePath,
      filePath,
      commit
    );
  },

  launchDiffTool: (revision, worktreePath, path) => {
    ipcRenderer.send(
      CommonIPCChannels.LaunchDiffTool,
      revision,
      worktreePath,
      path
    );
  },
};

contextBridge.exposeInMainWorld("gitjetCommon", bridge);
