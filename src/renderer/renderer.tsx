import { createRoot } from "react-dom/client";
import { useCallback, useLayoutEffect, useMemo } from "react";
import {
  FixedSizeList as List,
  ListChildComponentProps,
  ListOnItemsRenderedProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useGitStore } from "./store";

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

const Widths = [90, 180, 180, "100%"];
const HashAbbrLength = 8;

function useColumnWidths(): (number | string)[] {
  return Widths;
}

function getColumnWidthStyle(width: number | string): React.CSSProperties {
  return { width, flexShrink: typeof width === "number" ? 0 : 1 };
}

const CommitHash = ({ hash }: { hash: string }) => {
  return <span className="hash">{hash.substring(0, HashAbbrLength)}</span>;
};

const AuthorDisplay = ({ author }: { author: string }) => {
  const formatted = useMemo(
    () => author.substring(0, author.indexOf(" <")),
    [author]
  );
  return <>{formatted}</>;
};

function convertTimezoneOffsetToMinutes(offsetString: string) {
  const hours = parseInt(offsetString.slice(0, 3), 10);
  const minutes = parseInt(offsetString.slice(3), 10);
  const totalOffsetMinutes = hours * 60 + minutes;
  return totalOffsetMinutes;
}

const DateDisplay = ({ gitRawDateString }: { gitRawDateString: string }) => {
  const formattedData = useMemo(() => {
    const pieces = gitRawDateString.split(" ");
    const unixTimestamp = parseInt(pieces[0], 10);
    const timezoneOffsetMinutes = convertTimezoneOffsetToMinutes(pieces[1]);
    const adjustedTimestamp =
      unixTimestamp * 1000 + timezoneOffsetMinutes * 60 * 1000;
    const date = new Date(adjustedTimestamp);
    return date.toLocaleString();
  }, [gitRawDateString]);
  return <>{formattedData}</>;
};

const Row = ({ index, style }: ListChildComponentProps) => {
  const colWidths = useColumnWidths();
  const revision = useGitStore((state) => state.revisions[index]);
  const revisionData = useGitStore((state) => state.revisionData[revision]);
  return (
    <div className="dataRow" style={style}>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[0])}>
        <CommitHash hash={revision} />
      </div>
      <div
        className="dataCell"
        style={getColumnWidthStyle(colWidths[1])}
        title={revisionData?.author ?? ""}
      >
        {revisionData?.author && <AuthorDisplay author={revisionData.author} />}
      </div>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[2])}>
        {revisionData?.authorDate && (
          <DateDisplay gitRawDateString={revisionData.authorDate} />
        )}
      </div>
      <div
        className="dataCell"
        style={getColumnWidthStyle(colWidths[3])}
        title={revisionData?.message ?? ""}
      >
        {revisionData?.message}
      </div>
    </div>
  );
};

const BranchSelect = () => {
  const branch = useGitStore((state) => state.branch);
  return <div>Branch: {branch}</div>;
};

interface IDataListProps {
  height: number;
  width: number;
}

const DataList = ({ height, width }: IDataListProps) => {
  const revisions = useGitStore((state) => state.revisions);

  const onItemsRendered = useCallback(
    (props: ListOnItemsRenderedProps) => {
      const revisionData = useGitStore.getState().revisionData;
      const revisionsToLoad = revisions
        .slice(props.visibleStartIndex, props.visibleStopIndex)
        .filter((revision) => !revisionData.hasOwnProperty(revision));
      if (revisionsToLoad.length > 0) {
        gitjet.loadRevisionData(revisionsToLoad);
      }
    },
    [revisions]
  );

  return (
    <List
      height={height}
      itemCount={revisions.length}
      itemSize={22}
      width={width}
      onItemsRendered={onItemsRendered}
    >
      {Row}
    </List>
  );
};

const App = () => {
  useElectronCommunication();

  return (
    <div className="app">
      <div className="toolbar">
        <BranchSelect />
        <input type="text" className="searchInput" />
      </div>
      <TableHeader />
      <div className="list">
        <AutoSizer>
          {({ height, width }) => {
            return <DataList height={height} width={width} />;
          }}
        </AutoSizer>
      </div>
    </div>
  );
};

const TableHeader = () => {
  const colWidths = useColumnWidths();
  return (
    <div className="headers">
      <div className="header" style={getColumnWidthStyle(colWidths[0])}>
        Hash
      </div>
      <div className="header" style={getColumnWidthStyle(colWidths[1])}>
        Author
      </div>
      <div className="header" style={getColumnWidthStyle(colWidths[2])}>
        Date
      </div>
      <div className="header" style={getColumnWidthStyle(colWidths[3])}>
        Message
      </div>
    </div>
  );
};

const root = createRoot(document.body);
root.render(<App />);
