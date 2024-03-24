import { useGitStore } from "../store";

export const BranchSelect = () => {
  const branch = useGitStore((state) => state.branch);
  return <div>Branch: {branch}</div>;
};
