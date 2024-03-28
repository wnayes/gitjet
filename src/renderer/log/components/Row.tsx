import { memo, useMemo } from "react";
import { ListChildComponentProps } from "react-window";
import { useGitStore } from "../store";
import { getColumnWidthStyle, useColumnWidths } from "../constants";
import { GitRevisionData } from "../../../shared/GitTypes";

const HashAbbrLength = 8;

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

export const Row = ({ index, style }: ListChildComponentProps) => {
  const revisionData = useGitStore((state) => state.revisionData[index]);
  const selected = useGitStore((state) => index === state.selectedRevision);

  let rowClasses = "dataRow";
  if (selected) {
    rowClasses += " selected";
  }

  return (
    <div className={rowClasses} style={style} data-index={index}>
      <RowInternal revisionData={revisionData} />
    </div>
  );
};

interface IRowInternalProps {
  revisionData: GitRevisionData | null | undefined;
}

const RowInternal = memo(({ revisionData }: IRowInternalProps) => {
  const colWidths = useColumnWidths();
  return (
    <>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[0])}>
        {revisionData?.revision && <CommitHash hash={revisionData?.revision} />}
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
    </>
  );
});
