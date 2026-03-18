/**
 * Utility functions for handling Express query parameters and route parameters
 * Express query params can be string | string[] | undefined | ParsedQs
 * Express route params can be string | string[]
 */

import { ParsedQs } from 'qs';

/**
 * Safely extract a string value from query params
 * Returns undefined if the param is undefined or empty
 */
export function queryString(query: any, key: string): string | undefined {
  if (!query || typeof query !== 'object') return undefined;
  const value = query[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  if (typeof value === 'object' && 'toString' in value) return String(value);
  return undefined;
}

/**
 * Safely extract a string value from query params with a default
 */
export function queryStringDefault(query: any, key: string, defaultValue: string): string {
  return queryString(query, key) ?? defaultValue;
}

/**
 * Safely extract and parse an integer from query params
 */
export function queryInt(query: any, key: string, defaultValue: number): number {
  const value = queryString(query, key);
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely extract and parse a date from query params
 */
export function queryDate(query: any, key: string): Date | undefined {
  const value = queryString(query, key);
  if (value === undefined) return undefined;
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Safely extract a string or null from query params
 */
export function queryStringOrNull(query: any, key: string): string | null {
  return queryString(query, key) ?? null;
}

/**
 * Safely extract a string from route params
 * Route params are always strings in Express, but TypeScript types them as string | string[]
 */
export function routeParam(params: any, key: string): string {
  if (!params || typeof params !== 'object') return '';
  const value = params[key];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return '';
}

/**
 * Safely extract a string from route params with a default
 */
export function routeParamDefault(params: any, key: string, defaultValue: string): string {
  const value = routeParam(params, key);
  return value || defaultValue;
}
