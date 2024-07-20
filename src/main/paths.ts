import { stat } from "node:fs/promises";
import { getDirectory } from "../shared/paths";

/**
 * If `path` is a file, removes the file part of `path` and returns it.
 * If `path` is a directory, returns it as given.
 * @param path File or directory path.
 */
export async function getDirectoryIfFilePath(path: string): Promise<string> {
  const pathStat = await stat(path);
  if (pathStat.isFile()) {
    const dirPath = getDirectory(path);
    if (!dirPath) {
      throw new Error();
    }
    return dirPath;
  }
  return path;
}
