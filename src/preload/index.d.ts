import type { TableDmApi } from './index';

declare global {
  interface Window {
    tabledm: TableDmApi;
  }
}

export {};
