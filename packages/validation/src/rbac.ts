import { Role } from '@pos/shared-types';

const VALID_ROLES = new Set<string>(Object.values(Role));

/**
 * Checks whether an input string is a recognized canonical Role.
 */
export function isValidRole(value: unknown): value is Role {
  return typeof value === 'string' && VALID_ROLES.has(value);
}

/**
 * Checks whether an array contains only valid canonical Roles.
 */
export function isValidRoleList(roles: unknown): roles is Role[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    return false;
  }
  return roles.every((r) => isValidRole(r));
}

/**
 * Normalizes and validates an array of role strings.
 * Throws an error if any role is invalid.
 */
export function parseAndValidateRoles(roles: unknown): Role[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error('Roles must be a non-empty array of valid role strings');
  }

  const validated: Role[] = [];
  for (const r of roles) {
    if (!isValidRole(r)) {
      throw new Error(`Invalid role '${r}'. Allowed roles: ${Object.values(Role).join(', ')}`);
    }
    if (!validated.includes(r as Role)) {
      validated.push(r as Role);
    }
  }

  return validated;
}

