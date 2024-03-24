/** Appends new items onto an existing array. */
export function arrayAppend<T>(arr: T[], newItems: readonly T[]): void {
  // Avoiding spread since it can sometimes stack overflow (in theory).
  // But perhaps there is some more efficient approach to consider here.
  for (const item of newItems) {
    arr.push(item);
  }
}
