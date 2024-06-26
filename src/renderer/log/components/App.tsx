import { useLayoutEffect } from "react";
import { useGitStore } from "../store";
import { LogStateBreadcrumbs } from "./Breadcrumbs";
import { TableHeader } from "./TableHeader";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AutoSizer from "react-virtualized-auto-sizer";
import { DataList } from "./DataList";
import { LogRevisionDetails } from "./LogRevisionDetails";
import { SearchBox } from "./SearchBox";

function useElectronCommunication(): void {
  const setRepository = useGitStore((state) => state.setRepository);
  const setWorktree = useGitStore((state) => state.setWorktree);
  const setFilePath = useGitStore((state) => state.setFilePath);
  const setBranch = useGitStore((state) => state.setBranch);
  const setRevisionCountData = useGitStore(
    (state) => state.setRevisionDataCount
  );
  const setRevisionData = useGitStore((state) => state.setRevisionData);
  const setRefs = useGitStore((state) => state.setRefs);
  const setSearchResults = useGitStore((state) => state.setSearchResults);
  const setSearchProgress = useGitStore((state) => state.setSearchProgress);

  useLayoutEffect(() => {
    gitjet.onReceiveRepositoryInfo((args) => {
      setRepository(args.repository);
      setWorktree(args.worktree);
      setFilePath(args.filePath);
      setBranch(args.branch);
    });
    gitjet.onReceiveRevisionCount((args) => setRevisionCountData(args));
    gitjet.onReceiveRevisionData((args) => setRevisionData(args));
    gitjet.onReceiveRefs((args) => setRefs(args));
    gitjet.onSearchResults((args) => setSearchResults(args));
    gitjet.onSearchProgress((args) => setSearchProgress(args));
    gitjet.ready();
  }, []);
}

export const App = () => {
  useElectronCommunication();

  const selectedRevision = useGitStore((state) => state.selectedRevision);

  return (
    <div className="app">
      <LogStateBreadcrumbs />
      <SearchBox />
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
        {selectedRevision >= 0 && (
          <>
            <PanelResizeHandle className="panelResizer" style={{ height: 4 }} />
            <Panel maxSize={75}>
              <LogRevisionDetails revisionIndex={selectedRevision} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};
