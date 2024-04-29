import { BrowserWindow, Menu, ipcMain } from "electron";
import { CommonIPCChannels } from "../shared/ipc";
import { IMenuItemOptions } from "../shared/ContextMenu";

export function initializeContextMenuSupport(): void {
  ipcMain.handle(
    CommonIPCChannels.ShowContextMenu,
    (e: Electron.IpcMainInvokeEvent, menuItems: IMenuItemOptions[]) => {
      return new Promise((resolve) => {
        const template = menuItems.map((item, i) => {
          return {
            ...item,
            click: () => {
              resolve(i);
            },
          };
        });
        const menu = Menu.buildFromTemplate(template);
        menu.popup({
          window: BrowserWindow.fromWebContents(e.sender)!,
          callback: () => {
            resolve(-1);
          },
        });
      });
    }
  );
}
