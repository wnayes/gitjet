import { useGitStore } from "../store";

interface IBreadcrumbProps {
  caption: string;
}

const Breadcrumb = ({ caption }: IBreadcrumbProps) => {
  return <div className="breadcrumb">{caption}</div>;
};

const RepositoryBreadcrumb = () => {
  const repository =
    useGitStore((state) => state.repository) || "(unset repository)";
  return <Breadcrumb caption={repository} />;
};

const WorktreeBreadcrumb = () => {
  const repository = useGitStore((state) => state.repository);
  const worktree = useGitStore((state) => state.worktree);

  if (!worktree || repository === worktree) {
    return null;
  }

  return <Breadcrumb caption={worktree} />;
};

const BranchSelectBreadcrumb = () => {
  const branch = useGitStore((state) => state.branch) || "(unset branch)";
  return <Breadcrumb caption={branch} />;
};

const StatsBreadcrumb = () => {
  const revisionCount = useGitStore((state) => state.revisions.length);
  const revisionsLoaded = useGitStore((state) => state.revisionsLoaded);
  const caption = `${revisionCount}${revisionsLoaded ? "" : "+"}`;
  return <Breadcrumb caption={caption} />;
};

export const LogStateBreadcrumbs = () => {
  return (
    <div className="breadcrumbs">
      <RepositoryBreadcrumb />
      <WorktreeBreadcrumb />
      <BranchSelectBreadcrumb />
      <StatsBreadcrumb />
    </div>
  );
};
