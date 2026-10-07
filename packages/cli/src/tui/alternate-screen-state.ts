/**
 * Tracks whether Aurict currently owns the alternate screen. Leaving it with
 * `CSI ?1049l` also restores the saved cursor, so writing that sequence while
 * on the main screen (inline mode) would move the cursor back over existing
 * output. Exit paths consult this flag instead of switching unconditionally.
 */
let active = false

export function setAlternateScreenActive(value: boolean): void {
  active = value
}

export function alternateScreenActive(): boolean {
  return active
}
