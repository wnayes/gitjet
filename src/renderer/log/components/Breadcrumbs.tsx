import { useGitStore } from "../store";
import { HashAbbrLength } from "../../../shared/constants";
import { looksLikeCommitHash } from "../../../shared/GitTypes";
import {
  Breadcrumb,
  FilePathBreadcrumb,
  RepositoryBreadcrumb,
  WorktreeBreadcrumb,
} from "../../components/Breadcrumbs";

const LogRepositoryBreadcrumb = () => {
  const repository = useGitStore((state) => state.repository);
  return <RepositoryBreadcrumb repository={repository} />;
};

const LogWorktreeBreadcrumb = () => {
  const repository = useGitStore((state) => state.repository);
  const worktree = useGitStore((state) => state.worktree);
  return <WorktreeBreadcrumb repository={repository} worktree={worktree} />;
};

const LogFilePathBreadcrumb = () => {
  const filePath = useGitStore((state) => state.filePath);
  return <FilePathBreadcrumb filePath={filePath} />;
};

const LogBranchSelectBreadcrumb = () => {
  const branch = useGitStore((state) => state.branch) || "(unset branch)";
  const revisionCount = useGitStore((state) => state.revisionData.length);
  const revisionsLoaded = useGitStore((state) => state.revisionCountKnown);
  const searching = useGitStore((state) => state.searching);
  const searchResultCount = useGitStore((state) => state.searchResults.length);

  const branchDisplay = looksLikeCommitHash(branch)
    ? branch.substring(0, HashAbbrLength)
    : branch;
  const searchResultCountDisplay = searching ? `${searchResultCount} / ` : "";
  const revisionTotalDisplay = `${revisionCount}${revisionsLoaded ? "" : "+"}`;

  return (
    <Breadcrumb
      caption={`${branchDisplay} (${searchResultCountDisplay}${revisionTotalDisplay})`}
    />
  );
};

export const LogStateBreadcrumbs = () => {
  return (
    <div className="breadcrumbs">
      <LogRepositoryBreadcrumb />
      <LogWorktreeBreadcrumb />
      <LogFilePathBreadcrumb />
      <LogBranchSelectBreadcrumb />
    </div>
  );
};
