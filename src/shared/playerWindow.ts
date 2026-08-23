/** Player view only uses a second monitor, and only while the DM wants that window open. */
export function shouldShowPlayerWindow(hasSecondDisplay: boolean, wanted: boolean): boolean {
  return hasSecondDisplay && wanted
}
