import { IMenuItemOptions } from "./ContextMenu";
import {
  GitRefMap,
  GitRevisionData,
  RevisionCountArgs,
  RevisionDataArgs,
} from "./GitTypes";

export interface GitJetCommonBridge {
  showContextMenu(
    menuItems: IMenuItemOptions[],
    callback: (choice: number) => void
  ): void;
  showLogForCommit(
    repoPath: string,
    worktreePath: string,
    filePath: string | null | undefined,
    commit: string
  ): void;
  launchDiffTool(revision: string, worktreePath: string, path: string): void;
}

export enum CommonIPCChannels {
  ShowContextMenu = "ShowContextMenu",
  ShowLogForCommit = "showLogForCommit",
  LaunchDiffTool = "launchDiffTool",
}

export interface GitJetBlameBridge {
  blameOtherRevision(revision: string): void;
  loadRevisionData(revision: string): void;
  ready(): void;
  onReceiveRepositoryInfo(callback: (args: RepositoryInfoArgs) => void): void;
  onReceiveFileContents(callback: (contents: string) => void): void;
  onReceiveBlameData(callback: (blameData: BlameData[]) => void): void;
  onReceiveRevisionData(
    callback: (revisionData: GitRevisionData) => void
  ): void;
}

export enum BlameIPCChannels {
  BlameWindowReady = "blameWindowReady",
  BlameFileContents = "blameFileContents",
  BlameData = "blameData",
  BlameOtherRevision = "blameOtherRevision",
  BlameLoadRevisionData = "blameLoadRevisionData",
  BlameRevisionData = "blameRevisionData",
  BlameRepositoryInfo = "blameRepositoryInfo",
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
  Search = "search",
  SearchPause = "searchPause",
  SearchResume = "searchResume",
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
