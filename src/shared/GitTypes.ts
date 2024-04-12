export interface RevisionCountArgs {
  revisionCount: number;
  allLoaded: boolean;
}

export interface RevisionDataArgs {
  startIndex: number;
  data: GitRevisionData[];
}

export interface GitRefMap {
  [revision: string]: string | string[];
}

export interface GitRevisionData {
  revision: string;
  parents: string[];
  author: string | null;
  authorEmail: string | null;
  authorDate: string | null;
  subject: string | null;
  body: string | null;
  changes: readonly GitFileChange[] | null;
}

export interface GitFileChange {
  type: GitFileChangeType;
  path: string;
  newPath?: string;
}

export enum GitFileChangeType {
  Unknown = 0,
  Add = 1,
  Delete = 2,
  Modify = 3,
  Rename = 4,
}

export function gitFileChangeTypeStringToEnum(
  typeString: string
): GitFileChangeType {
  switch (typeString) {
    case "A":
      return GitFileChangeType.Add;
    case "D":
      return GitFileChangeType.Delete;
    case "M":
      return GitFileChangeType.Modify;
    case "R":
      return GitFileChangeType.Rename;
    default:
      console.error("Unexpected file change type: " + typeString);
      return GitFileChangeType.Unknown;
  }
}

export function gitFileChangeEnumToTypeString(
  change: GitFileChangeType
): string {
  switch (change) {
    case GitFileChangeType.Add:
      return "A";
    case GitFileChangeType.Delete:
      return "D";
    case GitFileChangeType.Modify:
      return "M";
    case GitFileChangeType.Rename:
      return "R";
    default:
      return "?";
  }
}

export function gitRefDisplayValue(refName: string): string {
  if (!refName) {
    return refName;
  }
  if (refName.startsWith("refs/heads/")) {
    return refName.substring("refs/heads/".length);
  }
  if (refName.startsWith("refs/remotes/")) {
    return refName.substring("refs/remotes/".length);
  }
  return refName;
}

const FullCommitHashRegex = /^[0-9a-f]{40}$/;

export function looksLikeCommitHash(value: string): boolean {
  return FullCommitHashRegex.test(value);
}

/**
 * Convert a git timestamp and timezone into a Date.
 * @param time Unix time value.
 * @param tz Time zone, like "-0500"
 * @returns Date instance
 */
export function gitTimeAndTzToDate(time: string, tz: string): Date {
  const sign = tz === "-" ? -1 : 1;
  const hours = parseInt(tz.slice(1, 3), 10);
  const minutes = parseInt(tz.slice(3), 10);
  const offsetInSeconds = sign * (hours * 60 * 60 + minutes * 60);
  const timestampMs = parseInt(time, 10) * 1000;
  const timestampWithOffset = timestampMs + offsetInSeconds * 1000;
  return new Date(timestampWithOffset);
}
