/** Normalises a filesystem path to forward slashes so comparisons and tool
 *  output stay identical on Windows and POSIX. */
export function toPosix(path: string): string {
  return path.split("\\").join("/")
}
