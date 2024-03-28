import { MutableRefObject, Ref, RefCallback, useCallback } from "react";

/** Creates one ref that forwards its value onto the given refs. */
export function useCombinedRef<T>(...refs: Ref<T>[]): RefCallback<T> {
  return useCallback((element: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(element);
      } else if (ref && typeof ref === "object") {
        (ref as MutableRefObject<T>).current = element;
      }
    }
  }, refs);
}
