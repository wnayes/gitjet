import { contextBridge, ipcRenderer } from "electron";
import {
  BlameData,
  BlameIPCChannels,
  BlameOptions,
  RepositoryInfoArgs,
  type GitJetBlameBridge,
} from "../shared/ipc";
import { GitRevisionData } from "../shared/GitTypes";
import "./commonPreload";

const bridge: GitJetBlameBridge = {
  blameOtherRevision: (revision: string) => {
    ipcRenderer.send(BlameIPCChannels.BlameOtherRevision, revision);
  },

  loadRevisionData: (revision: string) => {
    ipcRenderer.send(BlameIPCChannels.BlameLoadRevisionData, revision);
  },

  ready: () => ipcRenderer.send(BlameIPCChannels.BlameWindowReady),

  onReceiveRepositoryInfo(
    callback: (repositoryInfo: RepositoryInfoArgs) => void
  ): void {
    ipcRenderer.addListener(
      BlameIPCChannels.BlameRepositoryInfo,
      (src, repositoryInfo) => {
        callback(repositoryInfo);
      }
    );
  },

  onReceiveBlameOptions(callback: (options: BlameOptions) => void): void {
    ipcRenderer.addListener(BlameIPCChannels.BlameOptions, (src, options) => {
      callback(options);
    });
  },

  onReceiveFileContents(callback: (contents: string) => void): void {
    ipcRenderer.addListener(
      BlameIPCChannels.BlameFileContents,
      (src, contents) => {
        callback(contents);
      }
    );
  },

  onReceiveBlameData(callback: (blameData: BlameData[]) => void): void {
    ipcRenderer.addListener(BlameIPCChannels.BlameData, (src, blameData) => {
      callback(blameData);
    });
  },

  onReceiveRevisionData(
    callback: (revisionData: GitRevisionData) => void
  ): void {
    ipcRenderer.addListener(
      BlameIPCChannels.BlameRevisionData,
      (src, revisionData) => {
        callback(revisionData);
      }
    );
  },
};

contextBridge.exposeInMainWorld("gitjetBlame", bridge);
