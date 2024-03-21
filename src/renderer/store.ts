import { create } from "zustand";
import { RevisionDataArgs, RevisionsArgs } from "./gitjetMain";

export interface GitState {
  branch: string;
  revisions: string[];
  revisionData: { [revision: string]: GitRevisionData | null | undefined };
  selectedRevision?: string;
  setBranch(branch: string): void;
  setRevisions(args: RevisionsArgs): void;
  setRevisionData(args: RevisionDataArgs): void;
}

export interface GitRevisionData {
  author: string | null;
  authorDate: string | null;
  message: string | null;
}

export const useGitStore = create<GitState>((set) => ({
  branch: "",
  revisions: ["one", "two"],
  revisionData: {},
  selectRevision: (revision: string) =>
    set(() => ({ selectedRevision: revision })),
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
}));
