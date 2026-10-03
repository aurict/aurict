import type { UpdateInfo } from "../../util/update-check.js";
import type { LocalServerStatus } from "../../bootstrap.js";
import type { TuiMode } from "../render-mode.js";
import type { SessionExitSummary } from "../../util/exit-summary.js";

export interface AppProps {
  initialProvider: string;
  initialModel: string;
  initialTheme: string;
  workdir: string;
  system?: string;
  undercover?: boolean;
  updatePromise?: Promise<UpdateInfo | null>;
  localServer?: LocalServerStatus;
  tuiMode?: TuiMode;
  /** Settles once MCP servers and custom tools are connected. */
  servicesReady?: Promise<void>;
  /** `--resume <id>` or "latest" for `--continue`. */
  resumeSessionId?: string;
  /** Receives token usage and the session id right before the app exits. */
  onExitSummary?: (summary: SessionExitSummary) => void;
}
