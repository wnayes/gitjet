import { RevisionDetails } from "../../components/RevisionDetails";
import { useBlameStore, useRevisionData } from "../store";
import { useCallback } from "react";

interface IBlameRevisionDetailsProps {
  revision: string;
}

export const BlameRevisionDetails = ({
  revision,
}: IBlameRevisionDetailsProps) => {
  const revisionData = useRevisionData(revision);
  const repoPath = useBlameStore((state) => state.repository);
  const worktreePath = useBlameStore((state) => state.worktree);
  const filePath = useBlameStore((state) => state.filePath);
  const onCommitHashClick = useCallback(
    (commitHash: string) => {
      gitjetCommon.showLogForCommit(
        repoPath,
        worktreePath,
        filePath,
        commitHash
      );
    },
    [repoPath, worktreePath, filePath]
  );
  return (
    <RevisionDetails
      revisionData={revisionData}
      worktreePath={worktreePath}
      onCommitHashClick={onCommitHashClick}
    />
  );
};
