import { create } from "zustand";
import {
  GitRevisionData,
  RevisionDataArgs,
  RevisionCountArgs,
  GitRefMap,
} from "../../shared/GitTypes";
import { SearchProgressData, SearchResultData } from "../../shared/ipc";

export interface GitState {
  repository: string;
  worktree: string;
  filePath: string | null | undefined;
  branch: string;
  revisionCountKnown: boolean;
  revisionData: (GitRevisionData | null | undefined)[];
  refs: GitRefMap;
  selectedRevision: number;
  searchText: string;
  searching: boolean;
  searchPaused: boolean;
  searchResults: number[];
  searchCurrentRevisionIndex: number;
  setRepository(repository: string): void;
  setWorktree(worktree: string): void;
  setFilePath(filePath: string | null | undefined): void;
  setBranch(branch: string): void;
  setRevisionDataCount(args: RevisionCountArgs): void;
  setRevisionData(args: RevisionDataArgs): void;
  setRefs(args: GitRefMap): void;
  setSelectedRevision(revisionIndex: number): void;
  setSearchText(searchText: string): void;
  setSearching(searching: boolean): void;
  setSearchPaused(paused: boolean): void;
  setSearchResults(results: SearchResultData): void;
  setSearchProgress(progress: SearchProgressData): void;
}

export const useGitStore = create<GitState>((set) => ({
  repository: "",
  worktree: "",
  filePath: null,
  branch: "",

  revisionCountKnown: false,
  revisionData: [],
  refs: {},

  selectedRevision: -1,

  searchText: "",
  searching: false,
  searchPaused: false,
  searchResults: [],
  searchCurrentRevisionIndex: -1,

  setRepository: (repository) => set(() => ({ repository })),
  setWorktree: (worktree) => set(() => ({ worktree })),
  setFilePath: (filePath) => set(() => ({ filePath })),
  setBranch: (branch) => set(() => ({ branch })),

  setRevisionDataCount: (args) => {
    return set((state) => {
      const revisionData = [...state.revisionData];
      revisionData.length = args.revisionCount;
      return { revisionData, revisionCountKnown: args.allLoaded };
    });
  },
  setRevisionData: (args) => {
    return set((state) => {
      const { startIndex, data } = args;
      const revisionData = [...state.revisionData];
      for (let i = 0; i < data.length; i++) {
        revisionData[startIndex + i] = data[i];
      }
      return { revisionData };
    });
  },
  setRefs: (args) => {
    return set(() => {
      return { refs: args };
    });
  },

  setSelectedRevision: (revisionIndex: number) =>
    set(() => ({ selectedRevision: revisionIndex })),

  setSearchText: (searchText) => set(() => ({ searchText })),
  setSearching: (searching) =>
    set(() => ({
      searching,
      searchPaused: false,
      searchResults: [],
      selectedRevision: -1,
      searchCurrentRevisionIndex: -1,
    })),
  setSearchPaused: (paused) => set(() => ({ searchPaused: paused })),
  setSearchResults: (results) =>
    set((state) => {
      if (state.searchText !== results.searchText) {
        return {}; // Some lingering IPC from an out of date search?
      }

      return {
        searchResults: [...state.searchResults, ...results.revisionMatch],
      };
    }),
  setSearchProgress: (progress) =>
    set((state) => {
      if (state.searchText !== progress.searchText) {
        return {}; // Some lingering IPC from an out of date search?
      }

      return {
        searchCurrentRevisionIndex: progress.currentRevision,
      };
    }),
}));

/** Waits until the store has at least `count` search results in it. */
export function waitForSearchResults(count: number): Promise<void> {
  const state = useGitStore.getState();
  if (state.searchResults.length >= count) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const searchTextAtStart = state.searchText;
    const unsubscribe = useGitStore.subscribe((state) => {
      if (state.searchText !== searchTextAtStart) {
        unsubscribe();
        return; // Let the Promise linger?
      }
      if (state.searchResults.length > 0) {
        unsubscribe();
        resolve();
        return;
      }
    });
  });
}

export function pauseSearch(): void {
  useGitStore.getState().setSearchPaused(true);
  gitjet.pauseSearch();
}

export function resumeSearch(): void {
  useGitStore.getState().setSearchPaused(false);
  gitjet.resumeSearch();
}

export function useRevisionData(
  index: number
): GitRevisionData | null | undefined {
  return useGitStore((state) => {
    if (state.searching) {
      if (index < state.searchResults.length) {
        const revisionDataIndex = state.searchResults[index];
        const data = state.revisionData[revisionDataIndex];
        if (!data) {
          // We don't have it in the renderer; request that it be sent.
          gitjet.loadRevisionData(revisionDataIndex, 1);
        }
        return data;
      }
      return null;
    }
    return state.revisionData[index];
  });
}
