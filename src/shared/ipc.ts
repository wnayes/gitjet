import { IMenuItemOptions } from "./ContextMenu";
import { GitRefMap, RevisionCountArgs, RevisionDataArgs } from "./GitTypes";

export interface GitJetCommonBridge {
  showContextMenu(
    menuItems: IMenuItemOptions[],
    callback: (choice: number) => void
  ): void;
}

export enum CommonIPCChannels {
  ShowContextMenu = "ShowContextMenu",
}

export interface GitJetBlameBridge {
  blameOtherRevision(revision: string): void;
  ready(): void;
  onReceiveFileContents(callback: (contents: string) => void): void;
  onReceiveBlameData(callback: (blameData: BlameData[]) => void): void;
}

export enum BlameIPCChannels {
  BlameWindowReady = "blameWindowReady",
  BlameFileContents = "blameFileContents",
  BlameData = "blameData",
  BlameOtherRevision = "blameOtherRevision",
}

export interface BlameData {
  revision: string;
  previous?: string;
  revisionShortData?: RevisionShortData;
  /** The line number of the line in the original file */
  sourceLine: number;
  /** The line number of the line in the final file */
  resultLine: number;
  numLines: number;
}

export interface RevisionShortData {
  summary?: string;
  author?: RevisionUserInfo;
  committer?: RevisionUserInfo;
}

interface RevisionUserInfo {
  name?: string;
  email?: string;
  time?: string;
  tz?: string;
}

export interface GitJetMain {
  ready(): void;
  launchDiffTool(revision: string, path: string): void;
  onReceiveRepositoryInfo(callback: (args: RepositoryInfoArgs) => void): void;
  onReceiveRevisionCount(callback: (args: RevisionCountArgs) => void): void;
  onReceiveRevisionData(callback: (args: RevisionDataArgs) => void): void;
  onReceiveRefs(callback: (args: GitRefMap) => void): void;
  loadRevisionData(startIndex: number, count: number): Promise<void>;
  search(searchText: string): void;
  pauseSearch(): void;
  resumeSearch(): void;
  onSearchResults(callback: (results: SearchResultData) => void): void;
  onSearchProgress(callback: (progress: SearchProgressData) => void): void;
  showLogForCommit(commit: string): void;
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
  SearchPause = "searchPause",
  SearchResume = "searchResume",
  SearchProgress = "searchProgress",
  SearchResult = "searchResult",
  ShowLogForCommit = "showLogForCommit",
}

export interface SearchResultData {
  searchText: string;
  revisionMatch: number[];
}

export interface SearchProgressData {
  searchText: string;
  currentRevision: number;
}
