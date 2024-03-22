import { create } from "zustand";
import { RevisionDataArgs, RevisionsArgs } from "./gitjetMain";
import { GitFileChangeType, GitRevisionData } from "../shared/GitTypes";

export interface GitState {
  branch: string;
  revisions: string[];
  revisionData: { [revision: string]: GitRevisionData | null | undefined };
  selectedRevision?: string;
  setBranch(branch: string): void;
  setRevisions(args: RevisionsArgs): void;
  setRevisionData(args: RevisionDataArgs): void;
  setSelectedRevision(revision: string | undefined): void;
}

export const useGitStore = create<GitState>((set) => ({
  branch: "",
  revisions: [],
  revisionData: {},
  setBranch: (branch: string) => set(() => ({ branch: branch })),
  setRevisions: (args: RevisionsArgs) => {
    return set((state) => {
      let revisions = args.revisions;
      if (args.incremental) {
        revisions = [...state.revisions, ...args.revisions];
      }
      return { revisions };
    });
  },
  setRevisionData: (args: RevisionDataArgs) => {
    return set((state) => {
      let { revision, data } = args;
      const revisionData = { ...state.revisionData };
      revisionData[revision] = data;
      return { revisionData };
    });
  },
  setSelectedRevision: (revision: string | undefined) =>
    set(() => ({ selectedRevision: revision })),
}));
