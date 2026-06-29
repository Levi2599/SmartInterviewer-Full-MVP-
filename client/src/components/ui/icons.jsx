import React from 'react';

const paths = {
  alert: (<><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>),
  arrowLeft: (<><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>),
  arrowRight: (<><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>),
  barChart: (<><path d="M3 3v18h18" /><path d="M7 16v-5" /><path d="M12 16V7" /><path d="M17 16v-8" /></>),
  brain: (<><path d="M8 4a3 3 0 0 0-3 3v.4A3.5 3.5 0 0 0 3 10.5 3.5 3.5 0 0 0 6.5 14H8" /><path d="M16 4a3 3 0 0 1 3 3v.4a3.5 3.5 0 0 1 2 3.1A3.5 3.5 0 0 1 17.5 14H16" /><path d="M8 4v16" /><path d="M16 4v16" /><path d="M8 9h8" /><path d="M8 15h8" /></>),
  briefcase: (<><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" /><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M3 12h18" /></>),
  calendar: (<><path d="M8 2v4" /><path d="M16 2v4" /><path d="M3 9h18" /><path d="M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" /></>),
  check: (<path d="m20 6-11 11-5-5" />),
  checkCircle: (<><path d="M22 11.1V12a10 10 0 1 1-5.9-9.1" /><path d="m22 4-10 10.01-3-3" /></>),
  chevronDown: (<path d="m6 9 6 6 6-6" />),
  chevronUp: (<path d="m18 15-6-6-6 6" />),
  clipboard: (<><path d="M9 4h6" /><path d="M9 2h6v4H9z" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M8 11h8" /><path d="M8 16h5" /></>),
  close: (<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>),
  document: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h6" /></>),
  download: (<><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>),
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>),
  file: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></>),
  folder: (<><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /></>),
  home: (<><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>),
  info: (<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>),
  language: (<><path d="M5 8h14" /><path d="M12 4v4" /><path d="M7 8a8 8 0 0 0 10 8" /><path d="M17 8a8 8 0 0 1-10 8" /><path d="M3 20h7" /><path d="m5 20 3-7 3 7" /></>),
  lock: (<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  logOut: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
  menu: (<><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>),
  microphone: (<><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><path d="M12 19v3" /></>),
  play: (<path d="m8 5 11 7-11 7Z" />),
  plus: (<><path d="M12 5v14" /><path d="M5 12h14" /></>),
  refresh: (<><path d="M21 12a9 9 0 0 1-15.5 6.2" /><path d="M3 12A9 9 0 0 1 18.5 5.8" /><path d="M18 2v4h4" /><path d="M6 22v-4H2" /></>),
  settings: (<><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V22a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 6.1 4l.1.1a1.7 1.7 0 0 0 1.9.3h0a1.7 1.7 0 0 0 1-1.6V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 20 6.1l-.1.1a1.7 1.7 0 0 0-.3 1.9v0a1.7 1.7 0 0 0 1.6 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" /></>),
  shield: (<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />),
  speaker: (<><path d="M11 5 6 9H3v6h3l5 4Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>),
  stop: (<rect x="6" y="6" width="12" height="12" rx="2" />),
  target: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
  trash: (<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></>),
  trendDown: (<><path d="m3 7 6 6 4-4 8 8" /><path d="M21 11v6h-6" /></>),
  trendUp: (<><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>),
  upload: (<><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14" /></>),
  user: (<><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>),
  users: (<><path d="M16 21a6 6 0 0 0-12 0" /><circle cx="10" cy="8" r="4" /><path d="M22 21a5 5 0 0 0-5-5" /><path d="M17 4a3 3 0 0 1 0 6" /></>),
  wand: (<><path d="m15 4 5 5" /><path d="M14 5 3 16l5 5L19 10" /><path d="M6 3v3" /><path d="M4.5 4.5h3" /><path d="M20 16v3" /><path d="M18.5 17.5h3" /></>),
};

const emojiPattern = /[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?/gu;
const leadingIconPattern = /^[\s\p{Emoji_Presentation}\u{2600}-\u{27BF}\uFE0F]+/u;

export function stripUiIcons(value) {
  return String(value ?? '')
    .replace(emojiPattern, '')
    .replace(/[\u2190\u2192]/g, '')
    .replace(leadingIconPattern, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export default function Icon({ name, size = 18, title, style, strokeWidth = 2, ...props }) {
  const content = paths[name] || paths.info;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      {...props}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  );
}
