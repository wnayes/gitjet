export const HashAbbrLength = 10;

const Widths = [90, 180, 180, "100%"];

export function useColumnWidths(): (number | string)[] {
  return Widths;
}

export function getColumnWidthStyle(
  width: number | string
): React.CSSProperties {
  return { width, flexShrink: typeof width === "number" ? 0 : 1 };
}
