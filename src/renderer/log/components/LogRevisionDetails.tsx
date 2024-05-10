import { RevisionDetails } from "../../components/RevisionDetails";
import { useGitStore, useRevisionData } from "../store";
import { useCallback } from "react";

interface ILogRevisionDetailsProps {
  revisionIndex: number;
}

export const LogRevisionDetails = ({
  revisionIndex,
}: ILogRevisionDetailsProps) => {
  const revisionData = useRevisionData(revisionIndex);
  const repoPath = useGitStore((state) => state.repository);
  const worktreePath = useGitStore((state) => state.worktree);
  const filePath = useGitStore((state) => state.filePath);
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
