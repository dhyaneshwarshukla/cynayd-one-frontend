// App types
export interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  url?: string;
  domain?: string;
  isActive: boolean;
  systemApp: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAppAccess {
  id: string;
  userId: string;
  appId: string;
  assignedAt: string;
  expiresAt?: string;
  quota?: number;
  usedQuota: number;
  app: App;
}

export interface AppWithAccess extends App {
  access?: {
    assignedAt: string;
    expiresAt?: string;
    quota?: number;
    usedQuota: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  organizationSlug?: string;
  organizationType?: string;
  organizationSize?: string;
  industry?: string;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface AuthResponse {
  accessToken?: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
    emailVerified?: string | null;
  };
  message?: string;
  requiresVerification?: boolean;
  // MFA fields
  code?: string;
  userId?: string;
  email?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId?: string;
  emailVerified?: Date;
  mfaEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  userCount?: number;
  appCount?: number;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProductAccess {
  id: string;
  userId: string;
  productId: string;
  isActive: boolean;
  assignedAt: Date;
  assignedBy?: string;
  expiresAt?: Date;
  quota?: number;
  usedQuota: number;
  product: Product;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organizationId?: string;
  };
}

export interface SecurityEvent {
  id: string;
  userId?: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'INFO' | 'WARNING' | 'HIGH';
  details: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string | Date;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  userCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  action: string;
  description?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  profile: {
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
    timezone: string;
    language: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    security: boolean;
    updates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'organization';
    showEmail: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
  };
  security: {
    mfaEnabled: boolean;
    mfaMethod: 'sms' | 'email' | 'app';
    sessionTimeout: number;
    loginNotifications: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    sidebarCollapsed: boolean;
    compactMode: boolean;
    animations: boolean;
  };
}

export interface SystemSettings {
  organization: {
    name: string;
    slug: string;
    timezone: string;
    language: string;
    theme: string;
  };
  features: {
    hr: boolean;
    drive: boolean;
    connect: boolean;
    mail: boolean;
  };
  limits: {
    maxUsers: number;
    maxTeams: number;
    maxStorage: number;
    maxProducts: number;
  };
}

class ApiClient {
  private baseURL: string;
  private authToken: string | null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.authToken = this.getStoredToken();
  }

  // Token management
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getToken(): string | null {
    return this.authToken;
  }

  private setStoredToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
    this.authToken = token;
  }

  private removeStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    this.authToken = null;
  }

  // HTTP request helper
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Merge any existing headers from options
    if (options.headers) {
      if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value;
        });
      } else if (typeof options.headers === 'object') {
        Object.assign(headers, options.headers);
      }
    }

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    console.log('API Client - Making request:', {
      url,
      method: options.method || 'GET',
      hasAuth: !!this.authToken,
      headers: Object.keys(headers)
    });

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for CORS
    });

    console.log('API Client - Response received:', {
      url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Client - Error response:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Client - Success response:', {
      url,
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : 'N/A'
    });

    return data;
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Check if MFA is required
    if (response.code === 'MFA_REQUIRED') {
      // Create an error object that mimics the expected format
      const mfaError = new Error('MFA required') as any;
      mfaError.response = {
        data: {
          message: response.message,
          code: response.code,
          userId: response.userId,
          email: response.email
        }
      };
      throw mfaError;
    }
    
    if (response.accessToken) {
      this.setStoredToken(response.accessToken);
    }
    return response;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Only set token if registration includes tokens (not for email verification flow)
    if (response.accessToken) {
      this.setStoredToken(response.accessToken);
    }
    return response;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    
    this.setStoredToken(response.accessToken!);
    return response;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>('/api/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    this.setStoredToken(response.accessToken);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout request failed, but clearing local state');
    } finally {
      this.removeStoredToken();
    }
  }

  async resetPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPasswordConfirm(token: string, password: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/auth/reset-password-confirm', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/users/me');
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/api/users');
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Organization endpoints
  async getOrganizations(): Promise<Organization[]> {
    return this.request<Organization[]>('/api/organizations');
  }

  async getOrganizationStats(): Promise<{
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    totalTeams: number;
    totalProducts: number;
  }> {
    return this.request<{
      totalOrganizations: number;
      activeOrganizations: number;
      totalUsers: number;
      totalTeams: number;
      totalProducts: number;
    }>('/api/organizations/stats');
  }

  async getOrganizationDashboardStats(organizationId: string): Promise<{
    organization: {
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
    };
    users: {
      total: number;
      active: number;
      lastLogin: Date | null;
      firstLogin: Date | null;
    };
    apps: {
      total: number;
      activeAccess: number;
    };
    activity: {
      recentActivity: number;
      securityEvents: number;
    };
    trends: {
      userGrowth: number;
      appUsage: number;
    };
  }> {
    return this.request(`/api/organizations/${organizationId}/dashboard-stats`);
  }

  async getOrganizationById(id: string): Promise<Organization> {
    return this.request<Organization>(`/api/organizations/${id}`);
  }

  async createOrganization(data: Partial<Organization>): Promise<Organization> {
    return this.request<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    return this.request<Organization>(`/api/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(id: string): Promise<void> {
    return this.request<void>(`/api/organizations/${id}`, {
      method: 'DELETE',
    });
  }

  // Team endpoints
  async getTeams(): Promise<Team[]> {
    return this.request<Team[]>('/api/teams');
  }

  async createTeam(data: Partial<Team>): Promise<Team> {
    return this.request<Team>('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async inviteUser(data: { email: string; name: string; role?: string }): Promise<any> {
    return this.request('/api/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<{
    activeUsers: number;
    totalTeams: number;
    securityEvents: number;
  }> {
    return this.request('/api/dashboard/stats');
  }

  // User profile endpoints
  async getUserProfileStats(): Promise<{
    products: number;
    lastActive: string;
    activity: string;
    memberSince: Date;
    totalApps: number;
    recentActivity: number;
  }> {
    return this.request('/api/user/profile-stats');
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAuditLogs(options?: {
    startDate?: Date;
    endDate?: Date;
    action?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    if (options?.action) params.append('action', options.action);
    if (options?.resource) params.append('resource', options.resource);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return this.request<AuditLog[]>(`/api/audit-logs?${params.toString()}`);
  }

  async getAuditStats(): Promise<{
    totalLogs: number;
    todayLogs: number;
    userActions: number;
    systemActions: number;
    securityActions: number;
    dataChanges: number;
    loginEvents: number;
    adminActions: number;
    deviceCount: number;
    activeSessions: number;
  }> {
    return this.request('/api/audit-logs/stats');
  }

  async getAuditDevices(): Promise<Array<{
    userAgent: string;
    lastSeen: string;
    loginCount: number;
    ipAddress?: string;
    isCurrentDevice: boolean;
  }>> {
    return this.request('/api/audit-logs/devices');
  }

  async getLiveAuditLogs(since?: Date): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (since) params.append('since', since.toISOString());
    
    return this.request<AuditLog[]>(`/api/audit-logs/live?${params.toString()}`);
  }

  async exportAuditLogs(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());

    const response = await fetch(`${this.baseURL}/api/audit-logs/export?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }

    return response.blob();
  }

  async getSecurityEvents(options?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
    severity?: 'low' | 'medium' | 'high';
    limit?: number;
    offset?: number;
  }): Promise<SecurityEvent[]> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    if (options?.eventType) params.append('eventType', options.eventType);
    if (options?.severity) params.append('severity', options.severity);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.request<{ events: SecurityEvent[]; pagination: any }>(`/api/security-events?${params.toString()}`);
    return response.events || [];
  }

  async getSecurityStats(): Promise<{
    totalEvents: number;
    recentEvents: number;
    eventsByType: Array<{ eventType: string; count: number }>;
    eventsBySeverity: Array<{ severity: string; count: number }>;
    topUsers: Array<{ userId: string; count: number; user: any }>;
  }> {
    return this.request('/api/security-events/stats');
  }

  async createSampleSecurityEvents(): Promise<{ message: string; count: number }> {
    return this.request('/api/security-events/seed', {
      method: 'POST'
    });
  }


  // IP Whitelist Management
  async getIpWhitelist(): Promise<string[]> {
    return this.request('/api/security/ip-whitelist');
  }

  async addToIpWhitelist(ipAddress: string): Promise<{ message: string }> {
    return this.request('/api/security/ip-whitelist', {
      method: 'POST',
      body: JSON.stringify({ ipAddress })
    });
  }

  async removeFromIpWhitelist(ipAddress: string): Promise<{ message: string }> {
    return this.request(`/api/security/ip-whitelist/${encodeURIComponent(ipAddress)}`, {
      method: 'DELETE'
    });
  }

  // Threat Detection
  async getThreatAlerts(): Promise<any[]> {
    return this.request('/api/security/threat-alerts');
  }

  async acknowledgeThreatAlert(alertId: string): Promise<{ message: string }> {
    return this.request(`/api/security/threat-alerts/${alertId}/acknowledge`, {
      method: 'POST'
    });
  }

  // Security Reports
  async exportSecurityReport(format: 'pdf' | 'csv' | 'json'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/security/report?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
      }
    });
    return response.blob();
  }

  // Security Settings
  async getSecuritySettings(): Promise<any> {
    return this.request('/api/security-settings');
  }

  async updateSecuritySettings(settings: any): Promise<any> {
    return this.request('/api/security-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Role endpoints
  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/api/roles');
  }

  async getAvailableRoles(): Promise<Role[]> {
    return this.request<Role[]>('/api/roles/available');
  }

  async getRoleById(id: string): Promise<Role> {
    return this.request<Role>(`/api/roles/${id}`);
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    return this.request<Role>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return this.request<Role>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: string): Promise<void> {
    return this.request<void>(`/api/roles/${id}`, {
      method: 'DELETE',
    });
  }

  // Permission endpoints
  async getPermissions(): Promise<Permission[]> {
    return this.request<Permission[]>('/api/permissions');
  }

  async getPermissionById(id: string): Promise<Permission> {
    return this.request<Permission>(`/api/permissions/${id}`);
  }

  async createPermission(data: Partial<Permission>): Promise<Permission> {
    return this.request<Permission>('/api/permissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePermission(id: string, data: Partial<Permission>): Promise<Permission> {
    return this.request<Permission>(`/api/permissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePermission(id: string): Promise<void> {
    return this.request<void>(`/api/permissions/${id}`, {
      method: 'DELETE',
    });
  }

  // Role-Permission management endpoints
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return this.request<Permission[]>(`/api/roles/${roleId}/permissions`);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    return this.request<void>(`/api/roles/${roleId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permissionId }),
    });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    return this.request<void>(`/api/roles/${roleId}/permissions/${permissionId}`, {
      method: 'DELETE',
    });
  }

  // App endpoints
  async getApps(): Promise<App[]> {
    return this.request<App[]>('/api/apps');
  }

  async getUserApps(): Promise<AppWithAccess[]> {
    return this.request<AppWithAccess[]>('/api/apps/my-apps');
  }

  async getAppBySlug(slug: string): Promise<App> {
    return this.request<App>(`/api/apps/by-slug/${slug}`);
  }

  async getUsersForOrganization(organizationId: string, currentUserRole: string, currentUserOrgId?: string): Promise<User[]> {
    return this.request<User[]>(`/api/organizations/${organizationId}/users`, {
      method: 'GET',
      headers: {
        'X-User-Role': currentUserRole,
        'X-User-Org-Id': currentUserOrgId || '',
      },
    });
  }

  async getOrganizationsForUser(currentUserRole: string, currentUserOrgId?: string): Promise<Organization[]> {
    return this.request<Organization[]>('/api/organizations', {
      method: 'GET',
      headers: {
        'X-User-Role': currentUserRole,
        'X-User-Org-Id': currentUserOrgId || '',
      },
    });
  }

  async getAppsForOrganization(organizationId: string, currentUserRole: string, currentUserOrgId?: string): Promise<App[]> {
    return this.request<App[]>(`/api/organizations/${organizationId}/apps`, {
      method: 'GET',
      headers: {
        'X-User-Role': currentUserRole,
        'X-User-Org-Id': currentUserOrgId || '',
      },
    });
  }

  // App assignment methods
  async assignAppToUser(appId: string, userId: string, quota?: number, expiresAt?: string): Promise<any> {
    return this.request(`/api/apps/${appId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId, quota, expiresAt }),
    });
  }

  async revokeAppFromUser(appId: string, userId: string): Promise<void> {
    return this.request(`/api/apps/${appId}/revoke/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAllUserAppAccess(): Promise<UserAppAccess[]> {
    return this.request<UserAppAccess[]>('/api/apps/user-access');
  }

  async createApp(appData: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
    url?: string;
    domain?: string;
    systemApp?: boolean;
  }): Promise<App> {
    return this.request<App>('/api/apps', {
      method: 'POST',
      body: JSON.stringify(appData),
    });
  }

  async getAppById(id: string): Promise<App> {
    return this.request<App>(`/api/apps/${id}`);
  }

  async updateApp(id: string, data: Partial<App>): Promise<App> {
    return this.request<App>(`/api/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApp(id: string): Promise<void> {
    return this.request<void>(`/api/apps/${id}`, {
      method: 'DELETE',
    });
  }

  // App access management
  async assignAppAccess(appId: string, userId: string, options?: {
    quota?: number;
    expiresAt?: Date;
  }): Promise<UserAppAccess> {
    return this.request<UserAppAccess>(`/api/apps/${appId}/assign`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...options,
      }),
    });
  }

  async revokeAppAccess(appId: string, userId: string): Promise<void> {
    return this.request<void>(`/api/apps/${appId}/revoke/${userId}`, {
      method: 'DELETE',
    });
  }

  async generateSSOToken(appSlug: string): Promise<{ ssoToken: string }> {
    return this.request<{ ssoToken: string }>(`/api/apps/${appSlug}/sso-token`, {
      method: 'POST',
    });
  }

  // SSO token validation
  async validateSSOToken(token: string, appSlug?: string): Promise<{
    user: User;
    accessibleApps: App[];
  }> {
    return this.request<{
      user: User;
      accessibleApps: App[];
    }>('/api/sso/validate', {
      method: 'POST',
      body: JSON.stringify({ token, appSlug }),
    });
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    return this.request<void>(`/api/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionIds }),
    });
  }

  async getUsersWithRole(roleId: string): Promise<User[]> {
    return this.request<User[]>(`/api/roles/${roleId}/users`);
  }

  // Settings endpoints
  async getUserSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/api/settings/user');
  }

  async updateUserSettings(data: Partial<UserSettings>): Promise<UserSettings> {
    return this.request<UserSettings>('/api/settings/user', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getSystemSettings(): Promise<SystemSettings> {
    return this.request<SystemSettings>('/api/settings/system');
  }

  async updateSystemSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return this.request<SystemSettings>('/api/settings/system', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // MFA methods
  async setupMFA(): Promise<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  }> {
    return this.request('/api/mfa/setup', {
      method: 'POST',
    });
  }

  async verifyMFASetup(token: string): Promise<{ verified: boolean }> {
    return this.request('/api/mfa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async enableMFA(token: string, backupCodes?: string[]): Promise<{ message: string }> {
    return this.request('/api/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ token, backupCodes }),
    });
  }

  async disableMFA(password: string): Promise<{ message: string }> {
    return this.request('/api/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async verifyMFALogin(userId: string, token: string): Promise<{
    verified: boolean;
    backupCodeUsed?: boolean;
  }> {
    return this.request('/api/mfa/verify-login', {
      method: 'POST',
      body: JSON.stringify({ userId, token }),
    });
  }

  async getMFAStatus(): Promise<{
    enabled: boolean;
    hasSecret: boolean;
  }> {
    return this.request('/api/mfa/status');
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
