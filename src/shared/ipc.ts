import { GitRefMap, RevisionCountArgs, RevisionDataArgs } from "./GitTypes";

export interface GitJetMain {
  ready(): void;
  launchDiffTool(revision: string, path: string): void;
  onReceiveRepositoryInfo(callback: (args: RepositoryInfoArgs) => void): void;
  onReceiveRevisionCount(callback: (args: RevisionCountArgs) => void): void;
  onReceiveRevisionData(callback: (args: RevisionDataArgs) => void): void;
  onReceiveRefs(callback: (args: GitRefMap) => void): void;
  loadRevisionData(startIndex: number, count: number): Promise<void>;
  search(searchText: string): void;
  onSearchResults(callback: (results: SearchResultData) => void): void;
  onSearchProgress(callback: (progress: SearchProgressData) => void): void;
}

export interface RepositoryInfoArgs {
  repository: string;
  worktree: string;
  filePath: string | null | undefined;
  branch: string;
}

export enum IPCChannels {
  LoadRevisionData = "loadRevisionData",
  Ready = "ready",
  RepositoryInfo = "repositoryInfo",
  Revisions = "revisions",
  RevisionData = "revisionData",
  Refs = "refs",
  LaunchDiffTool = "launchDiffTool",
  Search = "search",
  SearchProgress = "searchProgress",
  SearchResult = "searchResult",
}

export interface SearchResultData {
  searchText: string;
  revisionMatch: number[];
}

export interface SearchProgressData {
  searchText: string;
  currentRevision: number;
}
