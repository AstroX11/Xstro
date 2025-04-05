import type { FileTypeResult } from 'file-type';

export type ContentTypeResult =
  | FileTypeResult
  | { isPath: true; path: unknown }
  | string
  | undefined;
