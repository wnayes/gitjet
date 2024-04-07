/**
 * Code to handle Windows-specific Squirrel setup.
 * Based on https://github.com/mongodb-js/electron-squirrel-startup/blob/master/index.js
 * and https://gist.github.com/cappert/fac1dba362d6a93a90f4
 */

import { resolve, basename, dirname, join } from "node:path";
import { spawn } from "node:child_process";

const fileKeyPath = "HKCU\\Software\\Classes\\*\\shell\\GitJet";
const directoryKeyPath = "HKCU\\Software\\Classes\\directory\\shell\\GitJet";
const backgroundKeyPath =
  "HKCU\\Software\\Classes\\directory\\background\\shell\\GitJet";

function getUpdateExePath() {
  return resolve(dirname(process.execPath), "..", "Update.exe");
}

function run(executable: string, args: string[], done: VoidFunction) {
  console.log("Spawning `%s` with args `%s`", executable, args);
  spawn(executable, args, {
    detached: true,
  }).on("close", done);
}

function spawnReg(args: string[], callback: VoidFunction) {
  const systemRoot = process.env.SystemRoot;
  const regPath = systemRoot
    ? join(systemRoot, "System32", "reg.exe")
    : "reg.exe";
  run(regPath, args, callback);
}

function installContextMenu(callback: VoidFunction) {
  function addToRegistry(args: string[], callback: VoidFunction) {
    args.unshift("add");
    args.push("/f");
    spawnReg(args, callback);
  }

  function installMenu(keyPath: string, arg: string, callback: VoidFunction) {
    let args = [keyPath, "/ve", "/d", "GitJet Log"];
    addToRegistry(args, () => {
      args = [keyPath, "/v", "Icon", "/d", process.execPath];
      addToRegistry(args, () => {
        args = [
          `${keyPath}\\command`,
          "/ve",
          "/d",
          `${process.execPath} log "${arg}"`,
        ];
        addToRegistry(args, callback);
      });
    });
  }

  installMenu(fileKeyPath, "%1", () => {
    installMenu(directoryKeyPath, "%1", () => {
      installMenu(backgroundKeyPath, "%V", callback);
    });
  });
}

function uninstallContextMenu(callback: VoidFunction) {
  function deleteFromRegistry(keyPath: string, callback: VoidFunction) {
    spawnReg(["delete", keyPath, "/f"], callback);
  }

  deleteFromRegistry(fileKeyPath, () => {
    deleteFromRegistry(directoryKeyPath, () => {
      deleteFromRegistry(backgroundKeyPath, callback);
    });
  });
}

export function handleSquirrelSetup(onSetupComplete: VoidFunction): boolean {
  if (process.platform === "win32") {
    const cmd = process.argv[1];
    const target = basename(process.execPath);

    if (cmd === "--squirrel-install" || cmd === "--squirrel-updated") {
      const updateExePath = getUpdateExePath();
      run(updateExePath, ["--createShortcut=" + target + ""], () => {
        installContextMenu(() => onSetupComplete());
      });
      return true;
    }
    if (cmd === "--squirrel-uninstall") {
      const updateExePath = getUpdateExePath();
      run(updateExePath, ["--removeShortcut=" + target + ""], () => {
        uninstallContextMenu(() => onSetupComplete());
      });
      return true;
    }
    if (cmd === "--squirrel-obsolete") {
      onSetupComplete();
      return true;
    }
  }
  return false;
}
