import { create } from "zustand";
import {
  GitRevisionData,
  RevisionDataArgs,
  RevisionCountArgs,
} from "../../shared/GitTypes";

export interface GitState {
  repository: string;
  worktree: string;
  branch: string;
  revisionCountKnown: boolean;
  revisionData: (GitRevisionData | null | undefined)[];
  selectedRevision: number;
  setRepository(repository: string): void;
  setWorktree(worktree: string): void;
  setBranch(branch: string): void;
  setRevisionDataCount(args: RevisionCountArgs): void;
  setRevisionData(args: RevisionDataArgs): void;
  setSelectedRevision(revisionIndex: number): void;
}

export const useGitStore = create<GitState>((set) => ({
  repository: "",
  worktree: "",
  branch: "",
  revisionCountKnown: false,
  revisionData: [],
  selectedRevision: -1,

  setRepository: (repository: string) => set(() => ({ repository })),
  setWorktree: (worktree: string) => set(() => ({ worktree })),
  setBranch: (branch: string) => set(() => ({ branch })),
  setRevisionDataCount: (args: RevisionCountArgs) => {
    return set((state) => {
      let revisionData = [...state.revisionData];
      revisionData.length = args.revisionCount;
      return { revisionData, revisionCountKnown: args.allLoaded };
    });
  },
  setRevisionData: (args: RevisionDataArgs) => {
    return set((state) => {
      let { startIndex, data } = args;
      const revisionData = [...state.revisionData];
      for (let i = 0; i < data.length; i++) {
        revisionData[startIndex + i] = data[i];
      }
      return { revisionData };
    });
  },
  setSelectedRevision: (revisionIndex: number) =>
    set(() => ({ selectedRevision: revisionIndex })),
}));
