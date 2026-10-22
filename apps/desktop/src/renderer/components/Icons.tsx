import React from 'react';

// 1.5px line icons on a 16px grid (SF Symbols-like). Decorative by default;
// the surrounding control carries the accessible name.
const PATHS = {
  plus: 'M8 3.5v9M3.5 8h9',
  search: 'M7.2 12.2a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM10.8 10.8 14 14',
  sidebar: 'M2.5 3.5h11v9h-11zM6 3.5v9',
  inspector: 'M2.5 3.5h11v9h-11zM10 3.5v9',
  gear: 'M8 10.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4ZM8 1.8v1.6M8 12.6v1.6M3.6 3.6l1.1 1.1M11.3 11.3l1.1 1.1M1.8 8h1.6M12.6 8h1.6M3.6 12.4l1.1-1.1M11.3 4.7l1.1-1.1',
  folder: 'M2 4.5a1 1 0 0 1 1-1h3l1.5 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z',
  file: 'M4 1.8h5l3 3V14a.2.2 0 0 1-.2.2H4.2A.2.2 0 0 1 4 14zM9 1.8v3h3',
  chevronDown: 'm4.5 6.5 3.5 3.5 3.5-3.5',
  chevronRight: 'm6.5 4.5 3.5 3.5-3.5 3.5',
  arrowUp: 'M8 13V3.5M4 7.5l4-4 4 4',
  stop: 'M5 5h6v6H5z',
  code: 'm5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5l3.5 3.5-3.5 3.5',
  context: 'M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  check: 'm3.5 8.5 3 3 6-7',
  close: 'm4 4 8 8M12 4l-8 8',
  pencil: 'M10.5 2.5 13.5 5.5 6 13H3v-3z',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 9h5.8l.6-9',
  branch: 'M5 2.5v11M11 2.5v3a3 3 0 0 1-3 3H5',
  archive: 'M2.5 3h11v3h-11zM3.5 6v7h9V6M6.5 8.5h3',
  restore: 'M3 8a5 5 0 1 0 1.5-3.5M3 2.5V5h2.5',
  terminal: 'M2 3.5h12v9H2zM4.5 6.5 6.5 8l-2 1.5M8 10h3',
  copy: 'M5.5 5.5h7v8h-7zM3.5 10.5V2.5h7',
  home: 'M2.5 7.5 8 3l5.5 4.5M4 6.5V13h8V6.5',
  memory: 'M3 4c0-1 2.2-1.8 5-1.8S13 3 13 4v8c0 1-2.2 1.8-5 1.8S3 13 3 12zM3 8c0 1 2.2 1.8 5 1.8S13 9 13 8M3 4c0 1 2.2 1.8 5 1.8S13 5 13 4',
  paperclip: 'M12.5 7.5 7.8 12.2a2.6 2.6 0 0 1-3.7-3.7l5-5a1.7 1.7 0 0 1 2.4 2.4l-5 5a.8.8 0 0 1-1.2-1.2L9.8 5.2',
  artifact: 'M3 2.5h10v11H3zM5.5 5.5h5M5.5 8h5M5.5 10.5h3',
  tasks: 'M3 4.5h1.5M3 8h1.5M3 11.5h1.5M7 4.5h6M7 8h6M7 11.5h6',
  export: 'M8 2.5v8M5 5.5l3-3 3 3M3 10v3h10v-3',
  sparkle: 'M8 2v3M8 11v3M2 8h3M11 8h3M4 4l1.8 1.8M10.2 10.2 12 12M4 12l1.8-1.8M10.2 5.8 12 4',
  sun: 'M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1',
  plug: 'M6 2v3M10 2v3M4.5 5h7v2.5a3.5 3.5 0 0 1-7 0zM8 11v3',
  phone: 'M5 1.8h6a.7.7 0 0 1 .7.7v11a.7.7 0 0 1-.7.7H5a.7.7 0 0 1-.7-.7v-11a.7.7 0 0 1 .7-.7ZM7 12h2',
  chart: 'M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5',
  commit: 'M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.5 8h4M10.5 8h4',
  command: 'M5.5 5.5h5v5h-5zM5.5 5.5H4a1.5 1.5 0 1 1 1.5-1.5zM10.5 5.5V4A1.5 1.5 0 1 1 12 5.5zM10.5 10.5H12a1.5 1.5 0 1 1-1.5 1.5zM5.5 10.5V12A1.5 1.5 0 1 1 4 10.5z',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d={PATHS[name]} /></svg>;
}
