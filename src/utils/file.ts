import { WriteFileOptions, mkdirSync, rmSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { dirname } from 'path';

export const assertDirectoryExists = (path: string) => {
  mkdirSync(dirname(path), { recursive: true });
};

export const writeFileEnsureDirectorySync = (
  file: string,
  data: Parameters<typeof writeFileSync>[1],
  options?: WriteFileOptions
) => {
  assertDirectoryExists(file);
  writeFileSync(file, data, options);
};

export const writeFileEnsureDirectory = async (
  file: string,
  data: Parameters<typeof writeFile>[1],
  options?: WriteFileOptions
) => {
  assertDirectoryExists(file);
  await writeFile(file, data, options);
};

export const removeDirectoryWithFilesSync = (path: string) => {
  rmSync(path, { recursive: true, force: true });
};
