/// <reference types="vite/client" />
/// <reference path="../../preload/index.d.ts" />

declare module '*.json' {
  const value: unknown
  export default value
}
