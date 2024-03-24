import { useLayoutEffect } from "react";
import { useGitStore } from "../store";
import { BranchSelect } from "./BranchSelect";
import { TableHeader } from "./TableHeader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AutoSizer from "react-virtualized-auto-sizer";
import { DataList } from "./DataList";
import { RevisionDetails } from "./RevisionDetails";

function useElectronCommunication(): void {
  const setBranch = useGitStore((state) => state.setBranch);
  const setRevisions = useGitStore((state) => state.setRevisions);
  const setRevisionData = useGitStore((state) => state.setRevisionData);

  useLayoutEffect(() => {
    gitjet.onSetBranch((branch) => setBranch(branch));
    gitjet.onReceiveRevisions((args) => setRevisions(args));
    gitjet.onReceiveRevisionData((args) => setRevisionData(args));
    gitjet.ready();
  }, []);
}

export const App = () => {
  useElectronCommunication();

  const selectedRevision = useGitStore((state) => state.selectedRevision);

  return (
    <div className="app">
      <div className="toolbar">
        <BranchSelect />
        <input type="text" className="searchInput" />
      </div>
      <TableHeader />
      <PanelGroup direction="vertical">
        <Panel maxSize={75}>
          <div className="list">
            <AutoSizer>
              {({ height, width }) => {
                return <DataList height={height} width={width} />;
              }}
            </AutoSizer>
          </div>
        </Panel>
        {!!selectedRevision && (
          <>
            <PanelResizeHandle className="panelResizer" style={{ height: 4 }} />
            <Panel maxSize={75}>
              <RevisionDetails revision={selectedRevision} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};
