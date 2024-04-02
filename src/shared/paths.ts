export function removeTrailingSlashes(path: string): string {
  return path.replace(/[\\\/]+$/, "");
}

export function removeGitFolderFromPath(path: string): string {
  return path.replace(/[\\\/]+\.git[\\\/]*$/, "");
}

/**
 * Returns the file name (or directory name) from a full path string.
 * @param path An input path, usually an absolute path.
 * @returns The last file name. "C:\A\B\C" returns "C" for example.
 */
export function getFileName(path: string): string {
  path = removeTrailingSlashes(path);

  const lastSlashIndex = Math.max(
    path.lastIndexOf("/"),
    path.lastIndexOf("\\")
  );
  if (lastSlashIndex === -1) {
    return path;
  }
  return path.substring(lastSlashIndex + 1);
}

export function getDirectory(path: string): string | null {
  path = removeTrailingSlashes(path);

  const lastSlashIndex = Math.max(
    path.lastIndexOf("/"),
    path.lastIndexOf("\\")
  );
  if (lastSlashIndex === -1) {
    return null;
  }
  return path.substring(0, lastSlashIndex);
}
