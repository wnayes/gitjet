const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gitjet", {
  ready: () => ipcRenderer.send("ready"),
  onReceiveRevisions: (callback) => {
    ipcRenderer.addListener("revisions", (src, args) => callback(args));
  },
});
