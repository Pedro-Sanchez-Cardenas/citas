import type { User } from '@/types';

export function hasRole(user: User | null | undefined, role: string): boolean {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(user: User | null | undefined, roles: string[]): boolean {
  if (!user || !Array.isArray(user.roles)) return false;
  return roles.some((role) => user.roles!.includes(role));
}

export function hasPermission(user: User | null | undefined, permission: string): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}

