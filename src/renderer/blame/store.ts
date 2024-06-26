import { create } from "zustand";
import { BlameData, BlameOptions, RevisionShortData } from "../../shared/ipc";
import { GitRevisionData } from "../../shared/GitTypes";

export interface BlameState {
  repository: string;
  worktree: string;
  filePath: string;
  revision: string;
  options: BlameOptions;
  fileContents: string[];
  revisionsByLine: string[];
  revisionShortData: { [revision: string]: RevisionShortData };
  revisionData: { [revision: string]: GitRevisionData };
  previousRevisions: { [revision: string]: string | undefined };
  hoveredRevision: string;
  selectedRevision: string;
  setRepository(repository: string): void;
  setWorktree(worktree: string): void;
  setFilePath(filePath: string): void;
  setRevision(branch: string): void;
  setOptions(options: Partial<BlameOptions>): void;
  setHoveredRevision(revision: string): void;
  setSelectedRevision(revision: string): void;
  setFileContents(fileContents: string[]): void;
  applyBlameData(blameData: BlameData[]): void;
  addRevisionData(revisionData: GitRevisionData): void;
}

export const useBlameStore = create<BlameState>((set) => ({
  repository: "",
  worktree: "",
  filePath: "",
  revision: "",
  options: {},
  fileContents: [],
  revisionsByLine: [],
  revisionShortData: {},
  revisionData: {},
  previousRevisions: {},
  hoveredRevision: "",
  selectedRevision: "",

  setRepository: (repository) => set(() => ({ repository })),
  setWorktree: (worktree) => set(() => ({ worktree })),
  setFilePath: (filePath) => set(() => ({ filePath })),
  setRevision: (revision) => set(() => ({ revision })),
  setOptions: (nextOptions) =>
    set((state) => {
      return { options: { ...state.options, ...nextOptions } };
    }),
  setHoveredRevision: (hoveredRevision) => set(() => ({ hoveredRevision })),
  setSelectedRevision: (selectedRevision) => set(() => ({ selectedRevision })),
  setFileContents: (fileContents) =>
    set((state) => {
      let revisionsByLine = state.revisionsByLine;
      if (revisionsByLine.length < fileContents.length) {
        revisionsByLine = [...revisionsByLine];
        revisionsByLine.length = fileContents.length;
      }
      return { fileContents, revisionsByLine };
    }),
  applyBlameData: (blameData) =>
    set((state) => {
      const revisionsByLine = [...state.revisionsByLine];
      const revisionShortData = { ...state.revisionShortData };
      let previousRevisions;
      for (const data of blameData) {
        for (
          let i = data.resultLine;
          i < data.resultLine + data.numLines;
          i++
        ) {
          revisionsByLine[i - 1] = data.revision;
        }
        if (data.revisionShortData) {
          revisionShortData[data.revision] = data.revisionShortData;
        }
        if (
          data.previous &&
          !(previousRevisions ?? state.previousRevisions)[data.revision]
        ) {
          if (!previousRevisions) {
            previousRevisions = { ...state.previousRevisions };
          }
          previousRevisions[data.revision] = data.previous;
        }
      }
      return {
        revisionsByLine,
        revisionShortData,
        previousRevisions: previousRevisions ?? state.previousRevisions,
      };
    }),

  addRevisionData: (revisionData) =>
    set((state) => {
      return {
        revisionData: {
          ...state.revisionData,
          [revisionData.revision]: revisionData,
        },
      };
    }),
}));

export function useRevisionData(
  revision: string
): GitRevisionData | null | undefined {
  return useBlameStore((state) => {
    const data = state.revisionData[revision];
    if (!data) {
      // We don't have it in the renderer; request that it be sent.
      gitjetBlame.loadRevisionData(revision);
    }
    return data;
  });
}
