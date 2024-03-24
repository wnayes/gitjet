import {
  GitFileChange,
  GitFileChangeType,
  GitRevisionData,
  gitFileChangeTypeStringToEnum,
} from "../shared/GitTypes";
import { exec } from "node:child_process";

export function loadRevisionData(
  repoPath: string,
  revision: string
): Promise<GitRevisionData> {
  return new Promise((resolve, reject) => {
    exec(
      `git -C "${repoPath}" show --format=format:"%an%x00%ae%x00%aI%x00%B%x00" --name-status --no-abbrev ${revision}`,
      function (error, stdout, stderr) {
        try {
          const lines = stdout.split("\x00");
          const data: GitRevisionData = {
            author: lines[0],
            authorEmail: lines[1],
            authorDate: lines[2],
            subject: null,
            body: null,
            changes: null,
          };
          const message = lines[3];
          const bodyBreak = message.indexOf("\n\n");
          if (bodyBreak > 0) {
            data.subject = message.substring(0, bodyBreak);
            data.body = message.substring(bodyBreak + 2);
          } else {
            data.subject = message;
          }

          const changes: GitFileChange[] = [];
          const changeLines = lines[4].split("\n");
          for (let i = 1; i < changeLines.length - 1; i++) {
            const line = changeLines[i];
            const typeString = line[0];
            const change: GitFileChange = {
              type: gitFileChangeTypeStringToEnum(typeString),
              path: line.substring(1).trimStart(),
            };
            if (change.type === GitFileChangeType.Rename) {
              // These show up as `017 old-path new-path`.
              // Not sure what the numbers refer to.
              const pieces = line.replace(/\s+/g, "\x00").split("\x00");
              change.path = pieces[pieces.length - 2];
              change.newPath = pieces[pieces.length - 1];
            } else {
              change.path = line.substring(1).trimStart();
            }
            changes.push(change);
          }
          data.changes = changes;

          resolve(data);
        } catch (e) {
          reject(e);
        }
      }
    );
  });
}
