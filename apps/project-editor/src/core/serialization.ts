import { validateProject } from '../domain/types';
import type { Project } from '../domain/types';

export const serializeProject = (project: Project): string => JSON.stringify(project, null, 2);

export const deserializeProject = (contents: string): Project => {
  const parsed = JSON.parse(contents);
  return validateProject(parsed);
};
