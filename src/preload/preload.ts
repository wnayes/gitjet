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

  onReceiveRefs: (callback) => {
    ipcRenderer.addListener(IPCChannels.Refs, (src, args) => callback(args));
  },

  loadRevisionData: (startIndex: number, count: number) => {
    return new Promise<void>(async (resolve) => {
      await ipcRenderer.invoke(IPCChannels.LoadRevisionData, startIndex, count);
      resolve();
    });
  },

  onReceiveRevisionData: (callback) => {
    _revisionDataCallbacks.add(callback);
  },

  search: (searchText: string) => {
    ipcRenderer.send(IPCChannels.Search, searchText);
  },

  onSearchResults: (callback) => {
    ipcRenderer.addListener(IPCChannels.SearchResult, (src, args) => {
      callback(args);
    });
  },

  onSearchProgress: (callback) => {
    ipcRenderer.addListener(IPCChannels.SearchProgress, (src, args) => {
      callback(args);
    });
  },
};

contextBridge.exposeInMainWorld("gitjet", bridge);
