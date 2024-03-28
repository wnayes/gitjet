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

interface IDataListProps {
  height: number;
  width: number;
}

export const DataList = ({ height, width }: IDataListProps) => {
  const revisionDatas = useGitStore((state) => state.revisionData);

  const searching = useGitStore((state) => state.searching);
  const searchResults = useGitStore((state) => state.searchResults);

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
            setSelectedRevision(dataIndex);
          }
        }
      }
    },
    [setSelectedRevision]
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
      return () =>
        containerEl.removeEventListener("click", onListElementClicked);
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

  const itemCount = searching ? searchResults.length + 1 : revisionDatas.length;

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
