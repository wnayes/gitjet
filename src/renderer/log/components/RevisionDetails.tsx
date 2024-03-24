import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useGitStore } from "../store";
import { FileChangesList } from "./FileChangesList";

interface IRevisionDetailsProps {
  revision: string;
}

export const RevisionDetails = ({ revision }: IRevisionDetailsProps) => {
  const revisionData = useGitStore((state) => state.revisionData[revision]);
  if (!revisionData) {
    return null;
  }

  return (
    <>
      <PanelGroup direction="vertical">
        <Panel minSize={5} defaultSize={40}>
          <div className="messageDisplay">
            {revisionData.subject}
            {"\n\n"}
            {revisionData.body}
          </div>
        </Panel>
        <PanelResizeHandle className="panelResizer" style={{ height: 2 }} />
        <Panel minSize={5}>
          <FileChangesList revision={revision} revisionData={revisionData} />
        </Panel>
      </PanelGroup>
    </>
  );
};
