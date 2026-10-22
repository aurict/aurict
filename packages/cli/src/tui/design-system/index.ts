/**
 * Design System — Index
 *
 * Export all primitives from a single point. Usage:
 *   import { HStack, VStack, Typo, Badge, Icon, Spinner, ProgressBar, Surface, Kbd, KeyHint } from "../tui/design-system"
 */

export {
  HStack, VStack, Spacer, VSpacer, Center, Cluster, Divider,
  type HStackProps, type VStackProps, type Spacing, type CenterProps, type ClusterProps,
} from "./Box.js"

export {
  Typo, T,
  TextDisplay, TextTitle, TextHeading, TextSubheading,
  TextBody, TextBodyEmphasis, TextCaption, TextLabel, TextCode, TextKbd,
  Tone,
  type TypoProps, type TextVariant, type TextTone,
} from "./Text.js"

export {
  Icon, getIcon, detectIconSet,
  type IconName, type IconSet, type IconProps,
} from "./Icon.js"

export {
  Spinner, useSpinnerFrame,
  ThinkingSpinner, WorkingSpinner, LoadingSpinner,
  DEFAULT_SPINNER,
  type SpinnerVariant, type SpinnerProps,
} from "./Spinner.js"

export {
  Badge,
  type BadgeProps, type BadgeTone, type BadgeVariant,
} from "./Badge.js"

export {
  ProgressBar, ContextBar,
  type ProgressBarProps, type ProgressVariant,
} from "./ProgressBar.js"

export {
  Surface, Card, Panel, Aside,
  type SurfaceProps, type SurfaceVariant, type SurfaceTone, type SurfaceElevation,
} from "./Surface.js"

export {
  Kbd, KeyHint,
  parseKeyString, formatKey, formatChord, detectPlatform,
  type KeySymbol, type KbdStyle, type KbdProps, type KeyHintProps, type Platform,
} from "./Kbd.js"

export {
  Corners, cornerColorFor,
  type CornersProps, type CornerTone,
} from "./Corners.js"

export {
  StatusDot,
  type StatusDotProps, type StatusTone,
} from "./StatusDot.js"

export {
  Eyebrow, MonoStat,
  type EyebrowProps, type MonoStatProps,
} from "./Eyebrow.js"

export {
  PaletteSwatch, PaletteSwatchRow,
  type PaletteSwatchProps,
} from "./PaletteSwatch.js"

export {
  motionEnabled, useBlinkFrame, usePulseFrame,
  BLINK_INTERVAL_MS, PULSE_INTERVAL_MS,
} from "./motion.js"

