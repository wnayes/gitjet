import { createRoot } from "react-dom/client";
import { useLayoutEffect } from "react";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useGitStore } from "./store";

function useElectronCommunication(): void {
  const setRevisions = useGitStore((state) => state.setRevisions);

  useLayoutEffect(() => {
    gitjet.onReceiveRevisions((args) => {
      setRevisions(args);
    });
    gitjet.ready();
  }, []);
}

const Row = ({ index, style }: ListChildComponentProps) => {
  const revision = useGitStore((state) => state.revisions[index]);
  return <div style={style}>{revision}</div>;
};

const App = () => {
  useElectronCommunication();

  const branch = useGitStore((state) => state.branch);
  const revisions = useGitStore((state) => state.revisions);

  return (
    <div className="app">
      <div className="toolbar">
        <div>Branch: {branch}</div>
        <input type="text" className="searchInput" />
      </div>
      <div className="list">
        <AutoSizer>
          {({ height, width }) => {
            return (
              <List
                height={height}
                itemCount={revisions.length}
                itemSize={22}
                width={width}
              >
                {Row}
              </List>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

const root = createRoot(document.body);
root.render(<App />);
