import { getColumnWidthStyle, useColumnWidths } from "../constants";

export const TableHeader = () => {
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
