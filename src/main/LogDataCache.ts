import { GitRevisionData, RevisionCountArgs } from "../shared/GitTypes";
import { GotRevisionsArgs, loadRevisionData, loadRevisionList } from "./git";

export class LogDataCache {
  private _revisions: string[] = [];
  private _revisionsLoadedPromise: Promise<void> | null;
  private _revisionData: Map<string, GitRevisionData> = new Map();
  private _revisionDataPromises: Map<string, Promise<GitRevisionData>> =
    new Map();
  private _gotRevisionsCallbacks: Set<(args: GotRevisionsArgs) => void> =
    new Set();

  public constructor(
    private worktreePath: string,
    private filePath: string | null | undefined,
    private branch: string
  ) {
    this._revisionsLoadedPromise = new Promise((resolve) => {
      loadRevisionList(this.worktreePath, this.branch, (args) => {
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
      });
    });
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
      if (!this._revisionsLoadedPromise) {
        throw new Error("Unexpected state");
      }
      await this._revisionsLoadedPromise;
    }

    const dataLoadPromises = [];
    for (let i = startIndex; i < startIndex + count; i++) {
      dataLoadPromises.push(this.loadRevisionData(this._revisions[i]));
    }
    return Promise.all(dataLoadPromises);
  }
}
