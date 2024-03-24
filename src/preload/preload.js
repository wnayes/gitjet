const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("gitjet", {
  ready: () => ipcRenderer.send("ready"),

  launchDiffTool: (revision, path) => {
    ipcRenderer.send("launchDiffTool", revision, path);
  },

  onReceiveRepositoryInfo: (callback) => {
    ipcRenderer.addListener("repositoryInfo", (src, args) => callback(args));
  },

  onReceiveRevisions: (callback) => {
    ipcRenderer.addListener("revisions", (src, args) => callback(args));
  },

  loadRevisionData: (revisions) => {
    ipcRenderer.send("loadRevisionData", revisions);
  },

  onReceiveRevisionData: (callback) => {
    ipcRenderer.addListener("revisionData", (src, args) => callback(args));
  },
});
