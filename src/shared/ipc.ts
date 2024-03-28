import { RevisionCountArgs, RevisionDataArgs } from "./GitTypes";

export interface GitJetMain {
  ready(): void;
  launchDiffTool(revision: string, path: string): void;
  onReceiveRepositoryInfo(callback: (args: RepositoryInfoArgs) => void): void;
  onReceiveRevisionCount(callback: (args: RevisionCountArgs) => void): void;
  onReceiveRevisionData(callback: (args: RevisionDataArgs) => void): void;
  loadRevisionData(startIndex: number, count: number): Promise<void>;
}

export interface RepositoryInfoArgs {
  repository: string;
  worktree: string;
  branch: string;
}

export enum IPCChannels {
  LoadRevisionData = "loadRevisionData",
  Ready = "ready",
  RepositoryInfo = "repositoryInfo",
  Revisions = "revisions",
  RevisionData = "revisionData",
  LaunchDiffTool = "launchDiffTool",
}
