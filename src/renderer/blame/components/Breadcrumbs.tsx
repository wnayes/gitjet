import { useBlameStore } from "../store";
import {
  FilePathBreadcrumb,
  RepositoryBreadcrumb,
  WorktreeBreadcrumb,
} from "../../components/Breadcrumbs";

const BlameRepositoryBreadcrumb = () => {
  const repository = useBlameStore((state) => state.repository);
  return <RepositoryBreadcrumb repository={repository} />;
};

const BlameWorktreeBreadcrumb = () => {
  const repository = useBlameStore((state) => state.repository);
  const worktree = useBlameStore((state) => state.worktree);
  return <WorktreeBreadcrumb repository={repository} worktree={worktree} />;
};

const BlameFilePathBreadcrumb = () => {
  const filePath = useBlameStore((state) => state.filePath);
  return <FilePathBreadcrumb filePath={filePath} />;
};

export const BlameBreadcrumbs = () => {
  return (
    <div className="breadcrumbs">
      <BlameRepositoryBreadcrumb />
      <BlameWorktreeBreadcrumb />
      <BlameFilePathBreadcrumb />
    </div>
  );
};
