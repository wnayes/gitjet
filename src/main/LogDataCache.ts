import { GitRevisionData } from "../shared/GitTypes";
import { GotRevisionsArgs, loadRevisionData, loadRevisionList } from "./git";
import { cpus } from "node:os";

export class LogDataCache {
  private _revisions: string[] = [];
  private _revisionsLoadedPromise: Promise<void> | null;
  private _revisionData: Map<string, GitRevisionData> = new Map();
  private _revisionDataPromises: Map<string, Promise<GitRevisionData>> =
    new Map();
  private _gotRevisionsCallbacks: Set<(args: GotRevisionsArgs) => void> =
    new Set();
  private _searchStates: Map<string, SearchState> = new Map();

  public constructor(
    private worktreePath: string,
    private filePath: string | null | undefined,
    private branch: string
  ) {
    this._revisionsLoadedPromise = new Promise((resolve) => {
      loadRevisionList(
        this.worktreePath,
        this.filePath,
        this.branch,
        (args) => {
          this._revisions = this._revisions.concat(args.revisions);
          this._gotRevisionsCallbacks.forEach((callback) => callback(args));
          if (args.allLoaded) {
            this._revisionsLoadedPromise = null;
            resolve();
          }

          // As soon as we have a decent number of revisions, kick off a data load.
          // This primes the cache for the expected first request from the UI.
          if (
            args.allLoaded ||
            (this._revisions.length > 50 &&
              this._revisionData.size === 0 &&
              this._revisionDataPromises.size === 0)
          ) {
            for (let i = 0; i < Math.min(50, this._revisions.length); i++) {
              this.loadRevisionData(this._revisions[i]);
            }
          }
        }
      );
    });
  }

  public getRevisionAtIndex(index: number): string | null {
    return this._revisions[index] ?? null;
  }

  public getRevisionCount(): number {
    return this._revisions.length;
  }

  public revisionsFullyLoaded(): boolean {
    return !this._revisionsLoadedPromise;
  }

  public onGotRevisions(callback: (args: GotRevisionsArgs) => void) {
    this._gotRevisionsCallbacks.add(callback);
  }

  public loadRevisionData(revision: string): Promise<GitRevisionData> {
    const data = this._revisionData.get(revision);
    if (data) {
      return Promise.resolve(data);
    }

    let dataPromise = this._revisionDataPromises.get(revision);
    if (dataPromise) {
      return dataPromise;
    }

    dataPromise = new Promise((resolve) => {
      loadRevisionData(this.worktreePath, revision).then((data) => {
        this._revisionData.set(revision, data);
        this._revisionDataPromises.delete(revision);
        resolve(data);
      });
    });
    this._revisionDataPromises.set(revision, dataPromise);
    return dataPromise;
  }

  public async loadRevisionDataRange(
    startIndex: number,
    count: number
  ): Promise<GitRevisionData[]> {
    if (startIndex + count >= this._revisions.length) {
      // If we don't have the promise, that means the list is actually loaded,
      // and shorter than what the client is asking for.
      if (this._revisionsLoadedPromise) {
        await this._revisionsLoadedPromise;
      }
    }

    const dataLoadPromises = [];
    const endIndex = Math.min(startIndex + count, this._revisions.length);
    for (let i = startIndex; i < endIndex; i++) {
      dataLoadPromises.push(this.loadRevisionData(this._revisions[i]));
    }
    return Promise.all(dataLoadPromises);
  }

  public async search(options: ISearchOptions): Promise<void> {
    if (!this._revisions.length && this._revisionsLoadedPromise) {
      await this._revisionsLoadedPromise;
    }

    const { searchText } = options;
    let searchState = this._searchStates.get(searchText);
    if (!searchState) {
      searchState = {
        currentIndex: 0,
        matches: [],
      };
      this._searchStates.set(searchText, searchState);
    } else if (searchState.matches.length > 0) {
      options.onResult(searchState.matches);
    }

    this._revisionLoadLoop(searchState.currentIndex);

    for (let i = searchState.currentIndex; i < this._revisions.length; i++) {
      searchState.currentIndex = i;

      const data = await this.loadRevisionData(this._revisions[i]);
      if (isSearchMatch(searchText, data)) {
        searchState.matches.push(i);
        options.onResult([i]);
      }

      if (i % 100 === 0) {
        options.onProgress?.(i);
      }

      // If we caught up to the revision load, wait for it now.
      if (i === this._revisions.length - 1 && this._revisionsLoadedPromise) {
        await this._revisionsLoadedPromise;
      }
    }

    options.onProgress?.(this._revisions.length);
  }

  private _revisionLoadLoop(startIndex: number): void {
    const ConcurrentCount = cpus().length;
    let numInFlight = 0;
    let curIndex = startIndex;
    const _this = this;

    function onNext() {
      numInFlight--;
      startMore();
    }

    function startMore() {
      while (
        numInFlight < ConcurrentCount &&
        curIndex < _this._revisions.length
      ) {
        numInFlight++;
        _this.loadRevisionData(_this._revisions[curIndex++]).then(onNext);
      }
    }

    startMore();
  }
}

interface SearchState {
  currentIndex: number;
  matches: number[];
}

interface ISearchOptions {
  searchText: string;
  onResult(revisionMatch: number[]): void;
  onProgress?(currentRevision: number): void;
}

function isSearchMatch(searchText: string, data: GitRevisionData): boolean {
  if (data.revision.includes(searchText)) {
    return true;
  }
  if (data.subject?.includes(searchText) || data.body?.includes(searchText)) {
    return true;
  }
  if (
    data.author?.includes(searchText) ||
    data.authorEmail?.includes(searchText)
  ) {
    return true;
  }
  if (data.changes) {
    for (const change of data.changes) {
      if (
        change.path.includes(searchText) ||
        change.newPath?.includes(searchText)
      ) {
        return true;
      }
    }
  }
  return false;
}
