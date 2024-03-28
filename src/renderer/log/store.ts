import { create } from "zustand";
import {
  GitRevisionData,
  RevisionDataArgs,
  RevisionCountArgs,
} from "../../shared/GitTypes";
import { SearchResultData } from "../../shared/ipc";

export interface GitState {
  repository: string;
  worktree: string;
  branch: string;
  revisionCountKnown: boolean;
  revisionData: (GitRevisionData | null | undefined)[];
  selectedRevision: number;
  searchText: string;
  searching: boolean;
  searchResults: number[];
  setRepository(repository: string): void;
  setWorktree(worktree: string): void;
  setBranch(branch: string): void;
  setRevisionDataCount(args: RevisionCountArgs): void;
  setRevisionData(args: RevisionDataArgs): void;
  setSelectedRevision(revisionIndex: number): void;
  setSearchText(searchText: string): void;
  setSearching(searching: boolean): void;
  setSearchResults(results: SearchResultData): void;
}

export const useGitStore = create<GitState>((set) => ({
  repository: "",
  worktree: "",
  branch: "",

  revisionCountKnown: false,
  revisionData: [],

  selectedRevision: -1,

  searchText: "",
  searching: false,
  searchResults: [],

  setRepository: (repository) => set(() => ({ repository })),
  setWorktree: (worktree) => set(() => ({ worktree })),
  setBranch: (branch) => set(() => ({ branch })),

  setRevisionDataCount: (args) => {
    return set((state) => {
      let revisionData = [...state.revisionData];
      revisionData.length = args.revisionCount;
      return { revisionData, revisionCountKnown: args.allLoaded };
    });
  },
  setRevisionData: (args) => {
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

  setSearchText: (searchText) => set(() => ({ searchText })),
  setSearching: (searching) =>
    set(() => ({ searching, searchResults: [], selectedRevision: -1 })),
  setSearchResults: (results) =>
    set((state) => {
      if (state.searchText !== results.searchText) {
        return {}; // Some lingering IPC from an out of date search?
      }

      return {
        searchResults: [...state.searchResults, ...results.revisionMatch],
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
