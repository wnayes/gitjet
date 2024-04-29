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
};

contextBridge.exposeInMainWorld("gitjetCommon", bridge);
