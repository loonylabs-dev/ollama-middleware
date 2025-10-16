/**
 * Generic validation utilities for request parameters and data
 */

export function validateRequestParams(
  params: Record<string, any>,
  required: string[]
): { isValid: boolean; missing: string[] } {
  const missing = required.filter(param => !params[param]);
  return {
    isValid: missing.length === 0,
    missing
  };
}

export function isValidJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

export function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

export function isValidRange(min: number, max: number, value: number): boolean {
  return value >= min && value <= max;
}
