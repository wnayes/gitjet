import { contextBridge, ipcRenderer } from "electron";
import { IPCChannels, type GitJetMain } from "../shared/ipc";
import { RevisionDataArgs } from "../shared/GitTypes";

const _revisionDataCallbacks: Set<(args: RevisionDataArgs) => void> = new Set();

ipcRenderer.addListener(IPCChannels.RevisionData, (src, args) => {
  _revisionDataCallbacks.forEach((callback) => callback(args));
});

const bridge: GitJetMain = {
  ready: () => ipcRenderer.send(IPCChannels.Ready),

  launchDiffTool: (revision, path) => {
    ipcRenderer.send(IPCChannels.LaunchDiffTool, revision, path);
  },

  onReceiveRepositoryInfo: (callback) => {
    ipcRenderer.addListener(IPCChannels.RepositoryInfo, (src, args) =>
      callback(args)
    );
  },

  onReceiveRevisionCount: (callback) => {
    ipcRenderer.addListener(IPCChannels.Revisions, (src, args) =>
      callback(args)
    );
  },

  loadRevisionData: (startIndex: number, count: number) => {
    return new Promise<void>((resolve) => {
      ipcRenderer.send(IPCChannels.LoadRevisionData, startIndex, count);

      const finishedCallback = (args: RevisionDataArgs) => {
        if (args.startIndex === startIndex && args.data.length === count) {
          _revisionDataCallbacks.delete(finishedCallback);
          resolve();
        }
      };
      _revisionDataCallbacks.add(finishedCallback);
    });
  },

  onReceiveRevisionData: (callback) => {
    _revisionDataCallbacks.add(callback);
  },
};

contextBridge.exposeInMainWorld("gitjet", bridge);
