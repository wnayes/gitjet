declare global {
  const gitjet: GitJetMain;
}

export interface GitJetMain {
  ready(): void;
  onReceiveRevisions(callback: (args: RevisionsArgs) => void): void;
}

export interface RevisionsArgs {
  revisions: string[];
  incremental: boolean;
}
