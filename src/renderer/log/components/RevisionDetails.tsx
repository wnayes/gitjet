import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useRevisionData } from "../store";
import { FileChangesList } from "./FileChangesList";
import { GitRevisionData } from "../../../shared/GitTypes";
import { HashAbbrLength } from "../constants";

interface IRevisionDetailsProps {
  revisionIndex: number;
}

export const RevisionDetails = ({ revisionIndex }: IRevisionDetailsProps) => {
  const revisionData = useRevisionData(revisionIndex);
  if (!revisionData) {
    return null;
  }

  return (
    <>
      <PanelGroup direction="vertical">
        <Panel minSize={5} defaultSize={40}>
          <div className="messageDisplay">
            <MergeCommitInfo revisionData={revisionData} />
            {revisionData.subject}
            {"\n\n"}
            {revisionData.body}
          </div>
        </Panel>
        <PanelResizeHandle className="panelResizer" style={{ height: 2 }} />
        <Panel minSize={5}>
          <FileChangesList revisionData={revisionData} />
        </Panel>
      </PanelGroup>
    </>
  );
};

function ParentHashLogLink({ commitHash }: { commitHash: string }) {
  return (
    <a
      className="link"
      onClick={(e) => {
        e.preventDefault();
        gitjet.showLogForCommit(commitHash);
      }}
    >
      {commitHash.substring(0, HashAbbrLength)}
    </a>
  );
}

function MergeCommitInfo({ revisionData }: { revisionData: GitRevisionData }) {
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
          <ParentHashLogLink commitHash={hash} />,
        ])}
    </div>
  );
}
