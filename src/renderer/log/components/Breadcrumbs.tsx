import { useGitStore } from "../store";
import {
  getFileName,
  removeGitFolderFromPath,
  removeTrailingSlashes,
} from "../../../shared/paths";

interface IBreadcrumbProps {
  caption: string;
}

const Breadcrumb = ({ caption }: IBreadcrumbProps) => {
  return <div className="breadcrumb">{caption}</div>;
};

const RepositoryBreadcrumb = () => {
  let repository =
    useGitStore((state) => state.repository) || "(unset repository)";
  repository = getFileName(removeGitFolderFromPath(repository));
  return <Breadcrumb caption={repository} />;
};

const WorktreeBreadcrumb = () => {
  const repository = useGitStore((state) => state.repository);
  const worktree = useGitStore((state) => state.worktree);

  if (!worktree || repoAndWorktreeMatch(repository, worktree)) {
    return null;
  }

  return <Breadcrumb caption={getFileName(worktree)} />;
};

const FilePathBreadcrumb = () => {
  const filePath = useGitStore((state) => state.filePath);
  if (!filePath) {
    return null;
  }
  const fileName = getFileName(filePath);

  return <Breadcrumb caption={fileName} />;
};

function repoAndWorktreeMatch(repository: string, worktree: string): boolean {
  return (
    removeGitFolderFromPath(repository) === removeTrailingSlashes(worktree)
  );
}

const BranchSelectBreadcrumb = () => {
  const branch = useGitStore((state) => state.branch) || "(unset branch)";
  const revisionCount = useGitStore((state) => state.revisionData.length);
  const revisionsLoaded = useGitStore((state) => state.revisionCountKnown);
  const searching = useGitStore((state) => state.searching);
  const searchResultCount = useGitStore((state) => state.searchResults.length);

  const searchResultCountDisplay = searching ? `${searchResultCount} / ` : "";
  const revisionTotalDisplay = `${revisionCount}${revisionsLoaded ? "" : "+"}`;

  return (
    <Breadcrumb
      caption={`${branch} (${searchResultCountDisplay}${revisionTotalDisplay})`}
    />
  );
};

export const LogStateBreadcrumbs = () => {
  return (
    <div className="breadcrumbs">
      <RepositoryBreadcrumb />
      <WorktreeBreadcrumb />
      <FilePathBreadcrumb />
      <BranchSelectBreadcrumb />
    </div>
  );
};
