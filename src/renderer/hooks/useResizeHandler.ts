import { RefObject, useEffect, useRef } from "react";

export function useResizeHandler(
  elementRef: RefObject<HTMLElement | undefined>,
  callback: VoidFunction
): void {
  const callbackRef = useRef<VoidFunction>();
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
