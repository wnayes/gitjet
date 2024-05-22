import {
  getFileName,
  normalizePath,
  removeGitFolderFromPath,
  removeTrailingSlashes,
} from "../../shared/paths";

interface IBreadcrumbProps {
  caption: string;
}

export const Breadcrumb = ({ caption }: IBreadcrumbProps) => {
  return <div className="breadcrumb">{caption}</div>;
};

interface IRepositoryBreadcrumbProps {
  repository: string;
}

export const RepositoryBreadcrumb = ({
  repository,
}: IRepositoryBreadcrumbProps) => {
  if (repository) {
    repository = getFileName(removeGitFolderFromPath(repository));
  } else {
    repository = "(unset repository)";
  }
  return <Breadcrumb caption={repository} />;
};

interface IWorktreeBreadcrumbProps {
  repository: string;
  worktree: string;
}

export const WorktreeBreadcrumb = ({
  repository,
  worktree,
}: IWorktreeBreadcrumbProps) => {
  if (!worktree || repoAndWorktreeMatch(repository, worktree)) {
    return null;
  }

  return <Breadcrumb caption={getFileName(worktree)} />;
};

interface IFilePathBreadcrumbProps {
  filePath: string | null | undefined;
}

export const FilePathBreadcrumb = ({ filePath }: IFilePathBreadcrumbProps) => {
  if (!filePath) {
    return null;
  }
  const fileName = getFileName(filePath);
  return <Breadcrumb caption={fileName} />;
};

function repoAndWorktreeMatch(repository: string, worktree: string): boolean {
  return (
    normalizePath(removeGitFolderFromPath(repository)) ===
    normalizePath(removeTrailingSlashes(worktree))
  );
}
