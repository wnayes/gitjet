import { create } from "zustand";
import { RevisionsArgs } from "./gitjetMain";

export interface GitState {
  branch: string;
  revisions: string[];
  selectedRevision?: string;
  setRevisions(args: RevisionsArgs): void;
}

export const useGitStore = create<GitState>((set) => ({
  branch: "",
  revisions: ["one", "two"],
  selectRevision: (revision: string) =>
    set(() => ({ selectedRevision: revision })),
  setRevisions: (args: RevisionsArgs) => {
    return set((state) => {
      let revisions = args.revisions;
      if (args.incremental) {
        revisions = [...state.revisions, ...args.revisions];
      }
      return { revisions };
    });
  },
}));
