import { create } from "zustand";
import { RevisionsArgs } from "../gitjetMain";
import { GitRevisionData, RevisionDataArgs } from "../../shared/GitTypes";

export interface GitState {
  repository: string;
  worktree: string;
  branch: string;
  revisions: string[];
  revisionsLoaded: boolean;
  revisionData: { [revision: string]: GitRevisionData | null | undefined };
  selectedRevision?: string;
  setRepository(repository: string): void;
  setWorktree(worktree: string): void;
  setBranch(branch: string): void;
  setRevisions(args: RevisionsArgs): void;
  setRevisionData(args: RevisionDataArgs): void;
  setSelectedRevision(revision: string | undefined): void;
}

export const useGitStore = create<GitState>((set) => ({
  repository: "",
  worktree: "",
  branch: "",
  revisions: [],
  revisionsLoaded: false,
  revisionData: {},

  setRepository: (repository: string) => set(() => ({ repository })),
  setWorktree: (worktree: string) => set(() => ({ worktree })),
  setBranch: (branch: string) => set(() => ({ branch })),
  setRevisions: (args: RevisionsArgs) => {
    return set((state) => {
      let revisions = state.revisions;
      if (args.revisions.length > 0) {
        revisions = args.revisions;
        if (args.incremental) {
          revisions = [...state.revisions, ...args.revisions];
        }
      }
      return { revisions, revisionsLoaded: args.allLoaded };
    });
  },
  setRevisionData: (args: RevisionDataArgs) => {
    return set((state) => {
      let { data } = args;
      const revisionData = { ...state.revisionData, ...data };
      return { revisionData };
    });
  },
  setSelectedRevision: (revision: string | undefined) =>
    set(() => ({ selectedRevision: revision })),
}));
