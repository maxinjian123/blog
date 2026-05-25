//#region src/utils/open.d.ts
interface OpenOptions {
  /**
   * Resolve only after the launched app exits.
   *
   * @default false
   */
  wait?: boolean;
}
/**
 * Open a URL, file, or other target in its default OS handler
 * (browser for URLs, Finder/Explorer for paths, etc.).
 */
declare function open(target: string, options?: OpenOptions): Promise<void>;
//#endregion
export { OpenOptions, open };