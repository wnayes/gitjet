import { Ref, useCallback, useEffect, useRef } from "react";
import { useGitStore, waitForSearchResults } from "../store";
import {
  FixedSizeList,
  FixedSizeList as List,
  ListOnItemsRenderedProps,
} from "react-window";
import { Row } from "./Row";
import InfiniteLoader from "react-window-infinite-loader";
import { useResizeHandler } from "../../hooks/useResizeHandler";
import { useCombinedRef } from "../../hooks/useCombinedRef";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  showContextMenu,
} from "../../components/ContextMenu";

interface IDataListProps {
  height: number;
  width: number;
}

export const DataList = ({ height, width }: IDataListProps) => {
  const revisionDatas = useGitStore((state) => state.revisionData);

  const searching = useGitStore((state) => state.searching);
  const searchResults = useGitStore((state) => state.searchResults);
  const searchPaused = useGitStore((state) => state.searchPaused);
  const searchFinished = useGitStore(
    (state) => state.searchCurrentRevisionIndex === state.revisionData.length
  );

  const listRef = useRef<FixedSizeList<any> | null>(null);
  const listContainerElRef = useRef<HTMLDivElement>();

  const setSelectedRevision = useGitStore((state) => state.setSelectedRevision);

  const getDataIndexFromEvent = useCallback((event: Event) => {
    const targetElement = event.target as Element;
    if (targetElement) {
      const rowElement = targetElement.closest(".dataRow") as HTMLDivElement;
      if (rowElement) {
        return parseInt(rowElement.dataset.index!, 10);
      }
    }
    return -1;
  }, []);

  const onListElementClicked = useCallback(
    (event: MouseEvent) => {
      const dataIndex = getDataIndexFromEvent(event);
      if (dataIndex >= 0) {
        setSelectedRevision(dataIndex);
      }
    },
    [getDataIndexFromEvent, setSelectedRevision]
  );

  const onListElementContextMenu = useCallback(
    (event: MouseEvent) => {
      const dataIndex = getDataIndexFromEvent(event);
      if (dataIndex >= 0) {
        setSelectedRevision(dataIndex);
        showContextMenu(
          <ContextMenu>
            <ContextMenuItem
              label="Copy revision to clipboard"
              onClick={() => {
                const revision =
                  useGitStore.getState().revisionData[dataIndex]?.revision;
                if (revision) {
                  navigator.clipboard.writeText(revision);
                }
              }}
            />
            <ContextMenuSeparator />
            <ContextMenuItem
              label="Create revert commit"
              onClick={() => {
                const state = useGitStore.getState();
                const worktreePath = state.worktree;
                const revision = state.revisionData[dataIndex]?.revision;
                if (revision) {
                  gitjetCommon.revertCommit(worktreePath, revision);
                }
              }}
            />
          </ContextMenu>
        );
      }
    },
    [getDataIndexFromEvent, setSelectedRevision]
  );

  const onListResize = useCallback(() => {
    // Avoiding component subscription to this value.
    const selectedRevisionIndex = useGitStore.getState().selectedRevision;
    if (selectedRevisionIndex >= 0) {
      listRef.current?.scrollToItem(selectedRevisionIndex);
    }
  }, []);

  useResizeHandler(listContainerElRef, onListResize);

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

  const isItemLoaded = useCallback(
    (index: number) => {
      return searching ? searchResults.length > index : !!revisionDatas[index];
    },
    [searching, revisionDatas]
  );

  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number) => {
      const count = stopIndex - startIndex + 1;
      if (count > 0) {
        if (searching) {
          return waitForSearchResults(startIndex + count);
        } else {
          return gitjet.loadRevisionData(startIndex, count);
        }
      }
      return Promise.resolve();
    },
    [searching]
  );

  let itemCount: number;
  if (searching) {
    itemCount = searchResults.length + (searchFinished || searchPaused ? 0 : 1);
  } else {
    itemCount = revisionDatas.length;
  }

  return (
    <InfiniteLoader
      isItemLoaded={isItemLoaded}
      itemCount={itemCount}
      loadMoreItems={loadMoreItems}
    >
      {({ onItemsRendered, ref }) => (
        <ListWrapper
          height={height}
          width={width}
          itemCount={itemCount}
          listRef={listRef}
          refFromInfiniteLoader={ref}
          listContainerElRef={listContainerElRef}
          onItemsRendered={onItemsRendered}
        />
      )}
    </InfiniteLoader>
  );
};

interface IListWrapperProps {
  height: number;
  width: number;
  itemCount: number;
  listContainerElRef: Ref<any>;
  listRef: Ref<any>;
  refFromInfiniteLoader: Ref<any>;
  onItemsRendered: (props: ListOnItemsRenderedProps) => any;
}

function ListWrapper(props: IListWrapperProps) {
  const combinedRef = useCombinedRef(
    props.listRef,
    props.refFromInfiniteLoader
  );
  return (
    <List
      height={props.height}
      itemCount={props.itemCount}
      itemSize={22}
      width={props.width}
      onItemsRendered={props.onItemsRendered}
      ref={combinedRef}
      outerRef={props.listContainerElRef}
    >
      {Row}
    </List>
  );
}
