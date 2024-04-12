import type { GitJetBlameBridge, GitJetMain } from "../shared/ipc";

declare global {
  const gitjetBlame: GitJetBlameBridge;
  const gitjet: GitJetMain;
}
