import { useCallback, useState } from "react";
import {
  GitFileChange,
  GitFileChangeType,
  GitRevisionData,
  gitFileChangeEnumToTypeString,
} from "../../shared/GitTypes";

interface IFileChangeRowProps {
  change: GitFileChange;
  selected?: boolean;
  onClick?: (change: GitFileChange) => void;
  onDoubleClick?: (change: GitFileChange) => void;
}

const FileChangeRow = ({
  change,
  selected,
  onClick,
  onDoubleClick,
}: IFileChangeRowProps) => {
  let rowClasses = "fileChangeRow";
  if (selected) {
    rowClasses += " selected";
  }

  const onRowClick = useCallback(() => onClick?.(change), [change, onClick]);
  const onRowDoubleClick = useCallback(
    () => onDoubleClick?.(change),
    [change, onDoubleClick]
  );

  let changeTypeClasses = "fileChangeType";
  switch (change.type) {
    case GitFileChangeType.Add:
      changeTypeClasses += " add";
      break;
    case GitFileChangeType.Delete:
      changeTypeClasses += " delete";
      break;
    case GitFileChangeType.Modify:
      changeTypeClasses += " modify";
      break;
    case GitFileChangeType.Rename:
      changeTypeClasses += " rename";
      break;
  }

  return (
    <div
      className={rowClasses}
      onClick={onRowClick}
      onDoubleClick={onRowDoubleClick}
    >
      <span className={changeTypeClasses}>
        {gitFileChangeEnumToTypeString(change.type)}
      </span>{" "}
      {change.path}
      {change.newPath && ` → ${change.newPath}`}
    </div>
  );
};

interface IFileChangesListProps {
  revisionData: GitRevisionData;
  worktreePath: string;
}

export const FileChangesList = ({
  revisionData,
  worktreePath,
}: IFileChangesListProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const onRowClick = useCallback((change: GitFileChange) => {
    setSelectedPath(change.path);
  }, []);

  const onRowDoubleClick = useCallback(
    (change: GitFileChange) => {
      gitjetCommon.launchDiffTool(
        revisionData.revision,
        worktreePath,
        change.path
      );
    },
    [revisionData]
  );

  return (
    <div className="fileChangesList">
      {revisionData.changes?.map((change) => {
        return (
          <FileChangeRow
            change={change}
            key={change.path}
            selected={change.path === selectedPath}
            onClick={onRowClick}
            onDoubleClick={onRowDoubleClick}
          />
        );
      })}
    </div>
  );
};
