import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useBlameStore } from "../store";
import { RevisionShortData } from "../../../shared/ipc";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { gitTimeAndTzToDate } from "../../../shared/GitTypes";
import {
  ContextMenu,
  ContextMenuItem,
  showContextMenu,
} from "../../components/ContextMenu";

export const BlameList = () => {
  const fileContents = useBlameStore((state) => state.fileContents);
  const setSelectedRevision = useBlameStore(
    (state) => state.setSelectedRevision
  );

  const listContainerElRef = useRef<HTMLDivElement>(null);

  const onListElementClicked = useCallback(
    (event: MouseEvent) => {
      const revision = getRevisionFromMouseEvent(event);
      if (revision) {
        setSelectedRevision(revision);
      }
    },
    [setSelectedRevision]
  );

  const onListElementContextMenu = useCallback((event: MouseEvent) => {
    const revision = getRevisionFromMouseEvent(event);
    if (revision) {
      const previousRevision =
        useBlameStore.getState().previousRevisions[revision];
      showContextMenu(
        <ContextMenu>
          {previousRevision && (
            <ContextMenuItem
              label="Blame previous revision"
              onClick={() => {
                gitjetBlame.blameOtherRevision(previousRevision);
              }}
            />
          )}
        </ContextMenu>
      );
    }
  }, []);

  useEffect(() => {
    const containerEl = listContainerElRef.current;
    if (containerEl) {
      containerEl.addEventListener("click", onListElementClicked);
      containerEl.addEventListener("contextmenu", onListElementContextMenu);
      return () => {
        containerEl.removeEventListener("click", onListElementClicked);
        containerEl.removeEventListener(
          "contextmenu",
          onListElementContextMenu
        );
      };
    }
  });

  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <List
            height={height}
            itemCount={fileContents.length}
            itemSize={18}
            width={width}
            outerRef={listContainerElRef}
          >
            {Row}
          </List>
        );
      }}
    </AutoSizer>
  );
};

function Row({ index, style }: ListChildComponentProps<string[]>) {
  const fileContents = useBlameStore((state) => state.fileContents);
  const rowRevision: string | undefined = useBlameStore(
    (state) => state.revisionsByLine[index]
  );
  const rowRevShortData: RevisionShortData | undefined = useBlameStore(
    (state) => state.revisionShortData[rowRevision]
  );
  const rowSelected = useBlameStore(
    (state) => rowRevision === state.selectedRevision
  );
  const rowHovered = useBlameStore(
    (state) => rowRevision === state.hoveredRevision
  );

  const setHoveredRevision = useBlameStore((state) => state.setHoveredRevision);
  const onMouseEnter = useCallback(() => {
    if (rowSelected) {
      setHoveredRevision("");
    } else {
      setHoveredRevision(rowRevision || "");
    }
  }, [rowSelected, rowRevision, setHoveredRevision]);
  const onMouseLeave = useCallback(() => {
    setHoveredRevision("");
  }, []);

  const date = useMemo(() => {
    const time = rowRevShortData?.committer?.time;
    const tz = rowRevShortData?.committer?.tz;
    if (time && tz) {
      return gitTimeAndTzToDate(time, tz);
    }
    return null;
  }, [rowRevShortData]);

  let rowClasses = "blameFileLine";
  if (rowSelected) {
    rowClasses += " selected";
  }
  if (rowHovered) {
    rowClasses += " hovered";
  }

  return (
    <div
      className={rowClasses}
      style={style}
      title={rowRevShortData?.summary}
      data-index={index}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="blameLineMetadata">
        <span className="blameFileLineAuthor">
          {formatEmail(rowRevShortData?.author?.email)}
        </span>
        <span className="blameFileLineDate">{date?.toLocaleDateString()}</span>
        <span
          className="blameFileLineNumber"
          style={{ width: getLineNumberColWidth(fileContents.length) }}
        >
          {index + 1}
        </span>
      </span>
      <span className="blameLineContent">{fileContents[index]}</span>
    </div>
  );
}

function formatEmail(email: string | null | undefined): string {
  if (!email) {
    return "";
  }
  if (email.startsWith("<") && email.endsWith(">")) {
    return email.substring(1, email.length - 1);
  }
  return email;
}

function getRevisionFromMouseEvent(event: MouseEvent): string | null {
  const targetElement = event.target as Element;
  if (targetElement) {
    const rowElement = targetElement.closest(
      ".blameFileLine"
    ) as HTMLDivElement;
    if (rowElement) {
      const dataIndex = parseInt(rowElement.dataset.index!, 10);
      if (dataIndex >= 0) {
        const revision = useBlameStore.getState().revisionsByLine[dataIndex];
        if (revision) {
          return revision;
        }
      }
    }
  }
  return null;
}

function getLineNumberColWidth(lines: number): number {
  // Yes, this is silly and can be generalized.
  const SingleNumCharWidth = 9;
  if (lines < 10) {
    return SingleNumCharWidth;
  }
  if (lines < 100) {
    return SingleNumCharWidth * 2;
  }
  if (lines < 1000) {
    return SingleNumCharWidth * 3;
  }
  if (lines < 10000) {
    return SingleNumCharWidth * 4;
  }
  if (lines < 100000) {
    return SingleNumCharWidth * 5;
  }
  if (lines < 1000000) {
    return SingleNumCharWidth * 6;
  }
  if (lines < 10000000) {
    return SingleNumCharWidth * 7;
  }
  return SingleNumCharWidth * 8;
}
