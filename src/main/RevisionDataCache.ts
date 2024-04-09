import { GitRevisionData } from "../shared/GitTypes";
import { loadRevisionData } from "./git";

const _revisionDataCachesByRepoPath: Map<string, RevisionDataCache> = new Map();

class RevisionDataCache {
  private _revisionData: Map<string, GitRevisionData> = new Map();
  private _revisionDataPromises: Map<string, Promise<GitRevisionData>> =
    new Map();

  public constructor(private repoPath: string) {}

  /** Returns true if there has been no revision data load kicked off yet. */
  public noRevisionDataLoadedYet(): boolean {
    return (
      this._revisionData.size === 0 && this._revisionDataPromises.size === 0
    );
  }

  /** Request to load a particular revision data. */
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
      loadRevisionData(this.repoPath, revision).then((data) => {
        this._revisionData.set(revision, data);
        this._revisionDataPromises.delete(revision);
        resolve(data);
      });
    });
    this._revisionDataPromises.set(revision, dataPromise);
    return dataPromise;
  }
}

/** Get the revision data cache for a particular repository by its path. */
export function getRevisionDataCache(repoPath: string): RevisionDataCache {
  let cache = _revisionDataCachesByRepoPath.get(repoPath);
  if (!cache) {
    cache = new RevisionDataCache(repoPath);
    _revisionDataCachesByRepoPath.set(repoPath, cache);
  }
  return cache;
}
