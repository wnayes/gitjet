import { create } from "zustand";
import { BlameData, RevisionShortData } from "../../shared/ipc";

export interface BlameState {
  repository: string;
  worktree: string;
  filePath: string;
  revision: string;
  fileContents: string[];
  revisionsByLine: string[];
  revisionShortData: { [revision: string]: RevisionShortData };
  hoveredRevision: string;
  selectedRevision: string;
  setRepository(repository: string): void;
  setWorktree(worktree: string): void;
  setFilePath(filePath: string): void;
  setRevision(branch: string): void;
  setHoveredRevision(revision: string): void;
  setSelectedRevision(revision: string): void;
  setFileContents(fileContents: string[]): void;
  applyBlameData(blameData: BlameData[]): void;
}

export const useBlameStore = create<BlameState>((set) => ({
  repository: "",
  worktree: "",
  filePath: "",
  revision: "",
  fileContents: [],
  revisionsByLine: [],
  revisionShortData: {},
  hoveredRevision: "",
  selectedRevision: "",

  setRepository: (repository) => set(() => ({ repository })),
  setWorktree: (worktree) => set(() => ({ worktree })),
  setFilePath: (filePath) => set(() => ({ filePath })),
  setRevision: (revision) => set(() => ({ revision })),
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
      }
      return { revisionsByLine, revisionShortData };
    }),
}));
