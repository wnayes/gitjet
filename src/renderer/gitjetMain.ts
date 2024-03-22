import { GitRevisionData } from "../shared/GitTypes";

declare global {
  const gitjet: GitJetMain;
}

export interface GitJetMain {
  ready(): void;
  launchDiffTool(revision: string, path: string): void;
  onSetBranch(callback: (branch: string) => void): void;
  onReceiveRevisions(callback: (args: RevisionsArgs) => void): void;
  onReceiveRevisionData(callback: (args: RevisionDataArgs) => void): void;
  loadRevisionData(revisions: string[]): void;
}

export interface RevisionsArgs {
  revisions: string[];
  incremental: boolean;
}

export interface RevisionDataArgs {
  revision: string;
  data: GitRevisionData;
}
