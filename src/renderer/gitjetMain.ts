import { GitRevisionData, RevisionDataArgs } from "../shared/GitTypes";

declare global {
  const gitjet: GitJetMain;
}

export interface GitJetMain {
  ready(): void;
  launchDiffTool(revision: string, path: string): void;
  onReceiveRepositoryInfo(callback: (args: RepositoryInfoArgs) => void): void;
  onReceiveRevisions(callback: (args: RevisionsArgs) => void): void;
  onReceiveRevisionData(callback: (args: RevisionDataArgs) => void): void;
  loadRevisionData(revisions: string[]): void;
}

export interface RepositoryInfoArgs {
  repository: string;
  worktree: string;
  branch: string;
}

export interface RevisionsArgs {
  revisions: string[];
  incremental: boolean;
  allLoaded: boolean;
}
