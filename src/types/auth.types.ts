import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      provider?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    provider?: string;
  }
}

export type AuthProvider = "google" | "github" | "microsoft" | "credentials";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  organizationId?: string;
  provider?: AuthProvider;
  image?: string;
}

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface RolePermissions {
  canViewAllOrganizations: boolean;
  canManageOrganizations: boolean;
  canViewAllUsers: boolean;
  canManageUsers: boolean;
  canViewAllApps: boolean;
  canManageApps: boolean;
  canViewAuditLogs: boolean;
  canManageRoles: boolean;
  canViewSecurityEvents: boolean;
  canManageSettings: boolean;
}

export interface AuthError {
  code: string;
  message: string;
} 