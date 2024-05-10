import { ipcMain } from "electron";
import { CommonIPCChannels } from "../shared/ipc";
import { getNullObjectHash, getParentRevision, launchDiffTool } from "./git";

export function initializeLaunchDiffViewerSupport(): void {
  ipcMain.on(
    CommonIPCChannels.LaunchDiffTool,
    async (
      e: Electron.IpcMainInvokeEvent,
      revision: string,
      worktreePath: string,
      path: string
    ) => {
      const parentRevision = await getParentRevision(worktreePath, revision);
      if (!parentRevision) {
        // We need to use special arguments for the very first revision diff.
        const nullHash = await getNullObjectHash(worktreePath);
        launchDiffTool(worktreePath, nullHash, revision, path);
      } else {
        launchDiffTool(worktreePath, null, revision, path);
      }
    }
  );
}
