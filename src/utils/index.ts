import type { ServerResult } from '@modelcontextprotocol/sdk/types.js';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import type { Results, ToolConfig } from '../types';

export * from './cache';
export * from './dayjs';
export * from './http';
export * from './logger';
export * from './rss';

export const defineToolConfig = async (
  config: ToolConfig | (() => ToolConfig | Promise<ToolConfig>),
): Promise<ToolConfig> => {
  if (typeof config === 'function') {
    return await config();
  }
  return config;
};

export const handleErrorResult = (error: unknown): ServerResult => {
  let errorMessage = '';
  if (error instanceof ZodError) {
    errorMessage = fromZodError(error).toString();
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = JSON.stringify(error);
  }
  return {
    content: [
      {
        type: 'text',
        text: errorMessage,
      },
    ],
    isError: true,
  };
};

export const handleSuccessResult = (results: Results, toolName: string): ServerResult => {
  const hiddenFields = (process.env.VN_NEWS_HIDDEN_FIELDS ?? '')
    .split(',')
    .filter(Boolean)
    .reduce<string[]>((fields, config) => {
      if (config.includes(':')) {
        const [tool, key] = config.split(':');
        if (tool === toolName) fields.push(key);
      } else {
        fields.push(config);
      }
      return fields;
    }, []);

  return {
    content: results.map((item) => ({
      type: 'text',
      text: Object.entries(item)
        .filter(([key, value]) => !hiddenFields.includes(key) && value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `<${key}>${String(value)}</${key}>`)
        .join('\n'),
    })),
  };
};

export const safeJsonParse = <T>(json: string): T | undefined => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
};
