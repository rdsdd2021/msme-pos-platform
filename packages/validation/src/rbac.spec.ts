import { Role } from '@pos/shared-types';
import { isValidRole, isValidRoleList, parseAndValidateRoles } from './rbac';

describe('RBAC Validation', () => {
  describe('isValidRole', () => {
    it('accepts all canonical roles', () => {
      expect(isValidRole('owner')).toBe(true);
      expect(isValidRole('branch_manager')).toBe(true);
      expect(isValidRole('cashier')).toBe(true);
      expect(isValidRole('inventory_staff')).toBe(true);
      expect(isValidRole('accountant')).toBe(true);
    });

    it('rejects unknown or invalid roles', () => {
      expect(isValidRole('superadmin')).toBe(false);
      expect(isValidRole('admin')).toBe(false);
      expect(isValidRole('guest')).toBe(false);
      expect(isValidRole('')).toBe(false);
      expect(isValidRole(123)).toBe(false);
      expect(isValidRole(null)).toBe(false);
    });
  });

  describe('isValidRoleList', () => {
    it('accepts non-empty arrays with valid roles', () => {
      expect(isValidRoleList(['owner'])).toBe(true);
      expect(isValidRoleList(['cashier', 'inventory_staff'])).toBe(true);
    });

    it('rejects empty arrays or invalid entries', () => {
      expect(isValidRoleList([])).toBe(false);
      expect(isValidRoleList(['cashier', 'invalid_role'])).toBe(false);
      expect(isValidRoleList(null)).toBe(false);
    });
  });

  describe('parseAndValidateRoles', () => {
    it('returns deduplicated list of valid roles', () => {
      const result = parseAndValidateRoles(['cashier', 'cashier', 'inventory_staff']);
      expect(result).toEqual([Role.CASHIER, Role.INVENTORY_STAFF]);
    });

    it('throws on invalid role input', () => {
      expect(() => parseAndValidateRoles(['owner', 'hacker'])).toThrow(
        /Invalid role 'hacker'/
      );
      expect(() => parseAndValidateRoles([])).toThrow();
    });
  });
});

