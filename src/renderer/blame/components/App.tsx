import { useLayoutEffect } from "react";
import { BlameList } from "./BlameList";
import { useBlameStore } from "../store";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { BlameRevisionDetails } from "./BlameRevisionDetails";
import { BlameBreadcrumbs } from "./Breadcrumbs";

export const App = () => {
  const setRepository = useBlameStore((state) => state.setRepository);
  const setWorktree = useBlameStore((state) => state.setWorktree);
  const setFilePath = useBlameStore((state) => state.setFilePath);
  const setOptions = useBlameStore((state) => state.setOptions);
  const setFileContents = useBlameStore((state) => state.setFileContents);
  const applyBlameData = useBlameStore((state) => state.applyBlameData);
  const addRevisionData = useBlameStore((state) => state.addRevisionData);

  useLayoutEffect(() => {
    gitjetBlame.onReceiveRepositoryInfo((args) => {
      setRepository(args.repository);
      setWorktree(args.worktree);
      setFilePath(args.filePath!);
    });
    gitjetBlame.onReceiveBlameOptions((options) => {
      setOptions(options);
    });
    gitjetBlame.onReceiveFileContents((content) => {
      const fileLines = content.split("\n");
      setFileContents(fileLines);
    });
    gitjetBlame.onReceiveBlameData((blameData) => {
      applyBlameData(blameData);
    });
    gitjetBlame.onReceiveRevisionData((revisionData) => {
      addRevisionData(revisionData);
    });
    gitjetBlame.ready();
  }, []);

  const selectedRevision = useBlameStore((state) => state.selectedRevision);

  return (
    <div className="app">
      <BlameBreadcrumbs />
      <PanelGroup direction="vertical">
        <Panel maxSize={75}>
          <BlameList />
        </Panel>
        {selectedRevision && (
          <>
            <PanelResizeHandle className="panelResizer" style={{ height: 4 }} />
            <Panel maxSize={75}>
              <BlameRevisionDetails revision={selectedRevision} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};
