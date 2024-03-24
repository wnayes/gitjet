import { useCallback, useEffect, useRef } from "react";
import { useGitStore } from "../store";
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
} from "react-window";
import { Row } from "./Row";
import { useResizeHandler } from "../../hooks/useResizeHandler";

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

export const DataList = ({ height, width }: IDataListProps) => {
  const revisions = useGitStore((state) => state.revisions);
  const selectedDataIndex = useRef<number>(-1);

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

  const listRef = useRef<FixedSizeList<any> | null>(null);
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
            selectedDataIndex.current = dataIndex;
            setSelectedRevision(revisions[dataIndex]);
          }
        }
      }
    },
    [setSelectedRevision, revisions]
  );

  const onListResize = useCallback(() => {
    if (selectedDataIndex.current >= 0) {
      listRef.current?.scrollToItem(selectedDataIndex.current);
    }
  }, []);

  useResizeHandler(listContainerElRef, onListResize);

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
      itemKey={(i) => revisions[i]}
      overscanCount={10}
      ref={listRef}
      outerRef={listContainerElRef}
    >
      {Row}
    </List>
  );
};
