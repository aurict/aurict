export type FocusLayer =
  | "permission"
  | "projectAuto"
  | "question"
  | "picker"
  | "prompt"
  | "keyboardShortcuts"
  | "subagent"
  | "transcriptSearch"
  | "historySearch"
  | "quickSearch"
  | "commandPalette"
  | "settings"
  | "designWizard"
  | "editing"
  | "plan"
  | "expanded"
  | "btw"
  | "taskPanel"
  | "attach"
  | "streaming"
  | "ready";

export interface FocusState {
  permission: boolean;
  projectAuto: boolean;
  question: boolean;
  picker: boolean;
  prompt: boolean;
  keyboardShortcuts: boolean;
  subagent: boolean;
  transcriptSearch: boolean;
  historySearch: boolean;
  quickSearch: boolean;
  commandPalette: boolean;
  settings: boolean;
  designWizard: boolean;
  editing: boolean;
  plan: boolean;
  expanded: boolean;
  btw: boolean;
  taskPanel: boolean;
  attach: boolean;
  streaming: boolean;
}
