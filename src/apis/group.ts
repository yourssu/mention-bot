import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { customGroups } from '@/cache/group';
import { CustomGroupType, groupKeywordSuffix } from '@/types/group';
import { assertDirectoryExists, writeFileEnsureDirectorySync } from '@/utils/file';

type UpsertCustomGroupProps = Pick<CustomGroupType, 'creatorSlackId' | 'memberSlackIds' | 'name'>;

export const customGroupFilePath = resolve(process.cwd(), 'db', 'customGroup.json');

export const readCustomGroupFile = () => {
  assertDirectoryExists(customGroupFilePath);
  if (!existsSync(customGroupFilePath)) {
    writeFileEnsureDirectorySync(customGroupFilePath, '{}', 'utf-8');
  }

  return JSON.parse(readFileSync(customGroupFilePath, 'utf-8')) as Record<string, CustomGroupType>;
};

export const syncCustomGroupCacheWithCustomGroupFile = () => {
  const db = readCustomGroupFile();
  for (const [groupName, group] of Object.entries(db)) {
    customGroups.set(groupName, group);
  }
};

export const updateCustomGroupFileForCurrentCache = () => {
  writeFileEnsureDirectorySync(
    customGroupFilePath,
    JSON.stringify(Object.fromEntries(customGroups)),
    'utf-8'
  );
};

export const upsertCustomGroup = async ({
  creatorSlackId,
  memberSlackIds,
  name,
}: UpsertCustomGroupProps) => {
  const getCurrentNewGroup = (): CustomGroupType => {
    if (!!cachedGroup) {
      return {
        ...cachedGroup,
        memberSlackIds,
        name: fullName,
        updaterSlackId: creatorSlackId,
        updatedAt: now.getTime(),
      };
    }
    return {
      creatorSlackId,
      memberSlackIds,
      name: fullName,
      createdAt: now.getTime(),
      updaterSlackId: undefined,
      updatedAt: undefined,
    };
  };

  const now = new Date();
  const fullName = `${groupKeywordSuffix}${name}`;
  const cachedGroup = customGroups.get(fullName);

  customGroups.set(fullName, getCurrentNewGroup());

  updateCustomGroupFileForCurrentCache();
};

export const deleteCustomGroup = async (groupName: string) => {
  customGroups.delete(groupName);
  updateCustomGroupFileForCurrentCache();
};

export const getAllCustomGroupNames = () => {
  return Array.from(customGroups.keys());
};
