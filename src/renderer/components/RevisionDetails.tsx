import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { GitRevisionData } from "../../shared/GitTypes";
import { HashAbbrLength } from "../../shared/constants";
import { FileChangesList } from "./FileChangesList";

interface IRevisionDetailsProps {
  revisionData: GitRevisionData | null | undefined;
  worktreePath: string;
  onCommitHashClick(commitHash: string): void;
}

export const RevisionDetails = ({
  revisionData,
  worktreePath,
  onCommitHashClick,
}: IRevisionDetailsProps) => {
  if (!revisionData) {
    return null;
  }

  return (
    <>
      <PanelGroup direction="vertical">
        <Panel minSize={5} defaultSize={40}>
          <div className="messageDisplay">
            <MergeCommitInfo
              revisionData={revisionData}
              onClick={onCommitHashClick}
            />
            {revisionData.subject}
            {"\n\n"}
            {revisionData.body}
          </div>
        </Panel>
        <PanelResizeHandle className="panelResizer" style={{ height: 2 }} />
        <Panel minSize={5}>
          <FileChangesList
            revisionData={revisionData}
            worktreePath={worktreePath}
          />
        </Panel>
      </PanelGroup>
    </>
  );
};

interface IParentHashLogLinkProps {
  commitHash: string;
  onClick(commitHash: string): void;
}

function ParentHashLogLink({ commitHash, onClick }: IParentHashLogLinkProps) {
  return (
    <a
      className="link"
      onClick={(e) => {
        e.preventDefault();
        onClick(commitHash);
      }}
    >
      {commitHash.substring(0, HashAbbrLength)}
    </a>
  );
}

interface IMergeCommitInfoProps {
  revisionData: GitRevisionData;
  onClick(commitHash: string): void;
}

function MergeCommitInfo({ revisionData, onClick }: IMergeCommitInfoProps) {
  if (!revisionData.parents || revisionData.parents.length <= 1) {
    return null;
  }

  return (
    <div className="mergeCommitInfo">
      Merge commit. Other parents:{" "}
      {revisionData.parents
        .slice(1)
        .map((hash, i) => [
          i > 0 && ", ",
          <ParentHashLogLink commitHash={hash} onClick={onClick} />,
        ])}
    </div>
  );
}
