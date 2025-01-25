import { RefObject, useEffect, useRef } from "react";

export function useResizeHandler(
  elementRef: RefObject<HTMLElement | null | undefined>,
  callback: VoidFunction
): void {
  const callbackRef = useRef<VoidFunction>(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!elementRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      callbackRef.current?.();
    });
    resizeObserver.observe(elementRef.current);
    return () => resizeObserver.disconnect();
  }, [elementRef]);
}
