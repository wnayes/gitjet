import { contextBridge, ipcRenderer } from "electron";
import {
  BlameData,
  BlameIPCChannels,
  type GitJetBlameBridge,
} from "../shared/ipc";

import "./commonPreload";

const bridge: GitJetBlameBridge = {
  blameOtherRevision: (revision: string) => {
    ipcRenderer.send(BlameIPCChannels.BlameOtherRevision, revision);
  },

  ready: () => ipcRenderer.send(BlameIPCChannels.BlameWindowReady),

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
};

contextBridge.exposeInMainWorld("gitjetBlame", bridge);
