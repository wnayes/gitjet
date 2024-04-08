import { memo, useMemo } from "react";
import { ListChildComponentProps } from "react-window";
import { useGitStore, useRevisionData } from "../store";
import {
  HashAbbrLength,
  getColumnWidthStyle,
  useColumnWidths,
} from "../constants";
import { GitRevisionData, gitRefDisplayValue } from "../../../shared/GitTypes";

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

const GitRef = ({ refName }: { refName: string }) => {
  return <span className="ref">{gitRefDisplayValue(refName)}</span>;
};

const RefsDisplay = ({
  refs,
}: {
  refs: string | string[] | null | undefined;
}) => {
  if (!refs) {
    return null;
  }
  if (typeof refs === "string") {
    return <GitRef refName={refs} />;
  } else if (Array.isArray(refs)) {
    return refs.map((refName) => <GitRef refName={refName} />);
  }
  return null;
};

export const Row = ({ index, style }: ListChildComponentProps) => {
  const revisionData = useRevisionData(index);
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
  const refs = useGitStore((state) => {
    if (revisionData?.revision) {
      return state.refs[revisionData.revision];
    }
    return null;
  });
  return (
    <>
      <div className="dataCell" style={getColumnWidthStyle(colWidths[0])}>
        {revisionData?.revision && <CommitHash hash={revisionData?.revision} />}
        {!revisionData && "Loading..."}
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
        <RefsDisplay refs={refs} />
        <span>{revisionData?.subject}</span>
        &nbsp;
        <span className="messageBody">{revisionData?.body}</span>
      </div>
    </>
  );
});
