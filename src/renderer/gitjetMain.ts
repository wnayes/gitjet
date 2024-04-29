import type {
  GitJetBlameBridge,
  GitJetCommonBridge,
  GitJetMain,
} from "../shared/ipc";

declare global {
  const gitjetCommon: GitJetCommonBridge;
  const gitjetBlame: GitJetBlameBridge;
  const gitjet: GitJetMain;
}
