export interface GitRevisionData {
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
