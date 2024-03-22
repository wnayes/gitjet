import { createRoot } from "react-dom/client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FixedSizeList as List,
  ListChildComponentProps,
  ListOnItemsRenderedProps,
} from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useGitStore } from "./store";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  GitFileChange,
  GitFileChangeType,
  GitRevisionData,
  gitFileChangeEnumToTypeString,
} from "../shared/GitTypes";

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
  return <>{author}</>;
};

const DateDisplay = ({ gitDateIsoString }: { gitDateIsoString: string }) => {
  const formattedData = useMemo(() => {
    const date = new Date(gitDateIsoString);
    return date.toLocaleString();
  }, [gitDateIsoString]);
  return <>{formattedData}</>;
};

const Row = ({ index, style }: ListChildComponentProps) => {
  const colWidths = useColumnWidths();
  const revision = useGitStore((state) => state.revisions[index]);
  const revisionData = useGitStore((state) => state.revisionData[revision]);
  const selectedRevision = useGitStore((state) => state.selectedRevision);

  let rowClasses = "dataRow";
  if (revision === selectedRevision) {
    rowClasses += " selected";
  }

  return (
    <div className={rowClasses} style={style} data-index={index}>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[0])}>
        <CommitHash hash={revision} />
      </div>
      <div
        className="dataCell"
        style={getColumnWidthStyle(colWidths[1])}
        title={`${revisionData?.author} <${revisionData?.authorEmail}>`}
      >
        {revisionData?.author && <AuthorDisplay author={revisionData.author} />}
      </div>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[2])}>
        {revisionData?.authorDate && (
          <DateDisplay gitDateIsoString={revisionData.authorDate} />
        )}
      </div>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[3])}>
        <span>{revisionData?.subject}</span>
        &nbsp;
        <span className="messageBody">{revisionData?.body}</span>
      </div>
    </div>
  );
};

const BranchSelect = () => {
  const branch = useGitStore((state) => state.branch);
  return <div>Branch: {branch}</div>;
};

function tryLoadRevisionData(
  startIndex: number,
  endIndex: number,
  loadedRevisions: Set<string>
): void {
  const state = useGitStore.getState();
  const revisionsToLoad = state.revisions
    .slice(startIndex, endIndex)
    .filter((revision) => !loadedRevisions.has(revision));
  if (revisionsToLoad.length > 0) {
    revisionsToLoad.forEach((revision) => loadedRevisions.add(revision));
    gitjet.loadRevisionData(revisionsToLoad);
  }
}

interface IDataListProps {
  height: number;
  width: number;
}

const DataList = ({ height, width }: IDataListProps) => {
  const revisions = useGitStore((state) => state.revisions);

  const loadedRevisions = useRef<Set<string>>();
  if (!loadedRevisions.current) {
    loadedRevisions.current = new Set();
  }

  const onItemsRendered = useCallback((props: ListOnItemsRenderedProps) => {
    tryLoadRevisionData(
      props.visibleStartIndex,
      props.visibleStopIndex,
      loadedRevisions.current!
    );
    tryLoadRevisionData(
      props.overscanStartIndex,
      props.overscanStopIndex,
      loadedRevisions.current!
    );
  }, []);

  const listContainerElRef = useRef<HTMLDivElement>();

  const setSelectedRevision = useGitStore((state) => state.setSelectedRevision);

  const onListElementClicked = useCallback(
    (event: MouseEvent) => {
      const targetElement = event.target as Element;
      if (targetElement) {
        const rowElement = targetElement.closest(".dataRow") as HTMLDivElement;
        if (rowElement) {
          const dataIndex = parseInt(rowElement.dataset.index!, 10);
          if (dataIndex >= 0) {
            setSelectedRevision(revisions[dataIndex]);
          }
        }
      }
    },
    [setSelectedRevision, revisions]
  );

  useEffect(() => {
    const containerEl = listContainerElRef.current;
    if (containerEl) {
      containerEl.addEventListener("click", onListElementClicked);
      return () =>
        containerEl.removeEventListener("click", onListElementClicked);
    }
  });

  return (
    <List
      height={height}
      itemCount={revisions.length}
      itemSize={22}
      width={width}
      onItemsRendered={onItemsRendered}
      overscanCount={10}
      innerRef={listContainerElRef}
    >
      {Row}
    </List>
  );
};

interface IFileChangeRowProps {
  change: GitFileChange;
  selected?: boolean;
  onClick?: (change: GitFileChange) => void;
  onDoubleClick?: (change: GitFileChange) => void;
}

const FileChangeRow = ({
  change,
  selected,
  onClick,
  onDoubleClick,
}: IFileChangeRowProps) => {
  let rowClasses = "fileChangeRow";
  if (selected) {
    rowClasses += " selected";
  }

  const onRowClick = useCallback(() => onClick?.(change), [change, onClick]);
  const onRowDoubleClick = useCallback(
    () => onDoubleClick?.(change),
    [change, onDoubleClick]
  );

  let changeTypeClasses = "fileChangeType";
  switch (change.type) {
    case GitFileChangeType.Add:
      changeTypeClasses += " add";
      break;
    case GitFileChangeType.Delete:
      changeTypeClasses += " delete";
      break;
    case GitFileChangeType.Modify:
      changeTypeClasses += " modify";
      break;
    case GitFileChangeType.Rename:
      changeTypeClasses += " rename";
      break;
  }

  return (
    <div
      className={rowClasses}
      onClick={onRowClick}
      onDoubleClick={onRowDoubleClick}
    >
      <span className={changeTypeClasses}>
        {gitFileChangeEnumToTypeString(change.type)}
      </span>{" "}
      {change.path}
      {change.newPath && ` → ${change.newPath}`}
    </div>
  );
};

interface IFileChangesListProps {
  revision: string;
  revisionData: GitRevisionData;
}

const FileChangesList = ({ revision, revisionData }: IFileChangesListProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const onRowClick = useCallback((change: GitFileChange) => {
    setSelectedPath(change.path);
  }, []);

  const onRowDoubleClick = useCallback(
    (change: GitFileChange) => {
      gitjet.launchDiffTool(revision, change.path);
    },
    [revision]
  );

  return (
    <div className="fileChangesList">
      {revisionData.changes?.map((change) => {
        return (
          <FileChangeRow
            change={change}
            key={change.path}
            selected={change.path === selectedPath}
            onClick={onRowClick}
            onDoubleClick={onRowDoubleClick}
          />
        );
      })}
    </div>
  );
};

interface IRevisionDetailsProps {
  revision: string;
}

const RevisionDetails = ({ revision }: IRevisionDetailsProps) => {
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

const App = () => {
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
