/**
 * The only renderer-facing API presentation components should consume.
 *
 * Keeping Ink behind this boundary lets the design system evolve without
 * spreading renderer imports throughout the application. Low-level shell,
 * input, measurement, and transcript hot paths are explicit exceptions.
 */
export {
  Box,
  Static,
  Text,
  measureElement,
  useApp,
  useInput,
  useStdout,
} from "ink";

export type {
  BoxProps,
  DOMElement,
  Key,
  TextProps,
} from "ink";
