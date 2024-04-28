import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useBlameStore } from "../store";
import { RevisionShortData } from "../../../shared/ipc";
import { useMemo } from "react";
import { gitTimeAndTzToDate } from "../../../shared/GitTypes";

export const BlameList = () => {
  const fileContents = useBlameStore((state) => state.fileContents);
  return (
    <AutoSizer>
      {({ height, width }) => {
        return (
          <List
            height={height}
            itemCount={fileContents.length}
            itemSize={18}
            width={width}
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

  const date = useMemo(() => {
    const time = rowRevShortData?.committer?.time;
    const tz = rowRevShortData?.committer?.tz;
    if (time && tz) {
      return gitTimeAndTzToDate(time, tz);
    }
    return null;
  }, [rowRevShortData]);

  return (
    <div
      className="blameFileLine"
      style={style}
      title={rowRevShortData?.summary}
    >
      <span className="blameFileLineAuthor">
        {rowRevShortData?.author?.email?.substring(1)}
      </span>
      <span className="blameFileLineDate">{date?.toLocaleDateString()}</span>
      <span
        className="blameFileLineNumber"
        style={{ width: getLineNumberColWidth(fileContents.length) }}
      >
        {index + 1}
      </span>
      {fileContents[index]}
    </div>
  );
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
