export type AppUpdateNotice =
  | { kind: 'available'; version: string }
  | { kind: 'downloading'; version: string; percent: number }
  | { kind: 'installing'; version: string }
  | { kind: 'failed'; version?: string }
  | { kind: 'current'; version: string }
  | { kind: 'offline' }
  | { kind: 'dev' }
