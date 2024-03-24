import { app } from "electron";
import { launchLogWindow } from "./log";

app.whenReady().then(() => {
  launchLogWindow();
});

app.on("window-all-closed", () => {
  app.quit();
});
