/// <reference types="vite/client" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../preload/index.d.ts" />

declare module '*.json' {
  const value: unknown;
  export default value;
}
