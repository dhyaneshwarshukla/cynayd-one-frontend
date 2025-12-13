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
  metadata?: string;
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
  paymentOrderId?: string;
  paymentId?: string;
  paymentSignature?: string;
  pricingId?: string;
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
  planId?: string;
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
  isActive?: boolean;
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
  planId?: string;
  plan?: Plan;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  features?: string;
  maxUsers?: number;
  maxApps?: number;
  maxStorage?: string;
  pricingType?: 'flat' | 'per_user';
  combinedLimits?: string;
  createdAt: Date;
  updatedAt: Date;
  pricings?: Pricing[];
  _count?: {
    organizations: number;
  };
}

export interface AddOn {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  appId?: string;
  planId?: string;
  configuration: any;
  pricing: any;
  isActive: boolean;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
  app?: App;
  plan?: Plan;
}

export interface Pricing {
  id: string;
  planId: string;
  plan?: Plan;
  billingPeriod: 'monthly' | 'quarterly' | 'yearly';
  price: string;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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

// Legacy Product interface - deprecated, use App instead
// Keeping for backward compatibility but should be migrated to App
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

// Legacy UserProductAccess interface - deprecated, use UserAppAccess instead
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
    maxApps: number;
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

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for CORS
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Create an error object with axios-like structure
      const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
      
      const error = new Error(errorMessage) as any;
      error.response = {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      };
      
      throw error;
    }

    // Handle 204 No Content and other empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return undefined as any;
    }

    // Check if response has content before trying to parse JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text.trim() === '') {
        return undefined as any;
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        // If JSON parsing fails, return undefined for void responses
        return undefined as any;
      }
    }

    // For non-JSON responses, return undefined
    return undefined as any;
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

  async getUsers(page?: number, limit?: number): Promise<User[] | { data: User[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/api/users?${queryString}` : '/api/users';
    const response = await this.request<any>(endpoint);
    
    // Check if response is paginated (has data and pagination properties)
    if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
      return response;
    }
    
    // Fallback to array format for backward compatibility
    return Array.isArray(response) ? response : [];
  }
  
  async deactivateUser(userId: string): Promise<User> {
    return this.request<User>(`/api/users/${userId}/deactivate`, {
      method: 'PATCH',
    });
  }
  
  async activateUser(userId: string): Promise<User> {
    return this.request<User>(`/api/users/${userId}/activate`, {
      method: 'PATCH',
    });
  }
  
  async toggleUserStatus(userId: string): Promise<User> {
    return this.request<User>(`/api/users/${userId}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async createUser(data: Partial<User>): Promise<User> {
    return this.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  uploadUsersCSV(
    file: File,
    onProgress?: (progress: number) => void,
    onUserStatus?: (status: {
      type: string;
      userNumber?: number;
      email?: string;
      name?: string;
      status?: string;
      message?: string;
      processed?: number;
      total?: number;
    }) => void
  ): {
    promise: Promise<{
      message: string;
      results: {
        total: number;
        success: number;
        failed: number;
        errors: Array<{ row: number; email?: string; error: string }>;
        created: Array<{ email: string; name: string }>;
      };
    }>;
    abort: () => void;
  } {
    let xhr: XMLHttpRequest | null = null;
    
    const promise = new Promise<{
      message: string;
      results: {
        total: number;
        success: number;
        failed: number;
        errors: Array<{ row: number; email?: string; error: string }>;
        created: Array<{ email: string; name: string }>;
      };
    }>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const url = `${this.baseURL}/api/users/upload-csv`;
      xhr = new XMLHttpRequest();

      let buffer = '';
      let finalResult: any = null;

      // Track upload progress
      let uploadComplete = false;
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
          // Mark upload as complete when it reaches 100%
          if (progress >= 100) {
            uploadComplete = true;
          }
        }
      });

      // Track when upload completes (but before response)
      xhr.upload.addEventListener('load', () => {
        uploadComplete = true;
        // Signal that upload is done, processing has started
        if (onProgress) {
          onProgress(100);
        }
      });

      // Handle streaming response data (newline-delimited JSON)
      xhr.addEventListener('progress', () => {
        if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
          // Process newline-delimited JSON
          const newData = xhr.responseText.substring(buffer.length);
          buffer = xhr.responseText;
          
          // Split by newlines to get individual JSON objects
          const lines = newData.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              
              if (parsed.type === 'user_status' && onUserStatus) {
                onUserStatus(parsed);
              } else if (parsed.type === 'progress' && onUserStatus) {
                onUserStatus(parsed);
              } else if (parsed.type === 'complete') {
                finalResult = parsed;
              }
            } catch (e) {
              // Ignore incomplete JSON chunks
            }
          }
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // Process any remaining data
            const lines = buffer.split('\n').filter(line => line.trim());
            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.type === 'complete') {
                  finalResult = parsed;
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
            
            if (finalResult && finalResult.results) {
              resolve({
                message: finalResult.message,
                results: finalResult.results
              });
            } else {
              // Fallback: try to parse entire response as JSON
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || errorData.error || `HTTP error! status: ${xhr.status}`));
          } catch (e) {
            reject(new Error(`HTTP error! status: ${xhr.status}`));
          }
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      // Set headers
      xhr.open('POST', url);
      if (this.authToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
      }
      xhr.withCredentials = true;

      // Send request
      xhr.send(formData);
    });

    return {
      promise,
      abort: () => {
        if (xhr) {
          xhr.abort();
        }
      }
    };
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
    totalApps: number;
  }> {
    return this.request<{
      totalOrganizations: number;
      activeOrganizations: number;
      totalUsers: number;
      totalTeams: number;
      totalApps: number;
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

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/users/${id}`, {
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
    apps: number;
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

  async getUserAppsByUserId(userId: string): Promise<AppWithAccess[]> {
    try {
      const response = await this.request<{ success: boolean; data: any[] }>(`/api/users/${userId}/user-apps`);
      console.log('getUserAppsByUserId response:', response);
      
      // Handle different response structures
      if (!response) {
        console.warn('Empty response from getUserAppsByUserId');
        return [];
      }
      
      // Check if response has success and data properties
      if (response.success !== undefined && response.data) {
        const apps = Array.isArray(response.data) ? response.data : [];
        console.log('Parsed apps array:', apps);
        
        // Transform the response to match AppWithAccess format
        return apps.map((app: any) => ({
          ...app,
          access: {
            assignedAt: app.assignedAt || new Date().toISOString(),
            expiresAt: app.expiresAt || null,
            quota: app.quota || null,
            usedQuota: app.usedQuota || 0
          }
        }));
      }
      
      // If response is directly an array (fallback)
      if (Array.isArray(response)) {
        return response.map((app: any) => ({
          ...app,
          access: {
            assignedAt: app.assignedAt || new Date().toISOString(),
            expiresAt: app.expiresAt || null,
            quota: app.quota || null,
            usedQuota: app.usedQuota || 0
          }
        }));
      }
      
      return [];
    } catch (error: any) {
      console.error('Error in getUserAppsByUserId:', error);
      throw error;
    }
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

  // Plans and Pricing methods
  async getPlans(activeOnly: boolean = false): Promise<Plan[]> {
    const endpoint = activeOnly ? '/api/plans/active' : '/api/plans';
    return this.request<Plan[]>(endpoint);
  }

  async getPlanById(id: string): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${id}`);
  }

  async getPlanBySlug(slug: string): Promise<Plan> {
    return this.request<Plan>(`/api/plans/slug/${slug}`);
  }

  async getDefaultPlan(): Promise<Plan> {
    return this.request<Plan>('/api/plans/default/get');
  }

  async getPricingsByPlanId(planId: string): Promise<Pricing[]> {
    return this.request<Pricing[]>(`/api/plans/${planId}/pricing`);
  }

  async assignPlanToOrganization(organizationId: string, planId: string): Promise<Organization> {
    return this.request<Organization>(`/api/organizations/${organizationId}/assign-plan`, {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  async getOrganizationPlanDetails(organizationId: string): Promise<Organization> {
    return this.request<Organization>(`/api/organizations/${organizationId}/plan-details`);
  }

  async createPlan(data: {
    name: string;
    slug: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
    features?: string;
    maxUsers?: number;
    maxApps?: number;
    maxStorage?: string | number;
    pricingType?: 'flat' | 'per_user';
    combinedLimits?: string;
  }): Promise<Plan> {
    return this.request<Plan>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlan(id: string, data: Partial<{
    name: string;
    slug: string;
    description?: string;
    isActive?: boolean;
    isDefault?: boolean;
    features?: string;
    maxUsers?: number;
    maxApps?: number;
    maxStorage?: string | number;
    pricingType?: 'flat' | 'per_user';
    combinedLimits?: string;
  }>): Promise<Plan> {
    return this.request<Plan>(`/api/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlan(id: string): Promise<void> {
    return this.request<void>(`/api/plans/${id}`, {
      method: 'DELETE',
    });
  }

  async createPricing(data: {
    planId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    price: number;
    currency?: string;
    isActive?: boolean;
  }): Promise<Pricing> {
    return this.request<Pricing>('/api/plans/pricing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePricing(id: string, data: Partial<{
    planId: string;
    billingPeriod: 'monthly' | 'quarterly' | 'yearly';
    price: number;
    currency?: string;
    isActive?: boolean;
  }>): Promise<Pricing> {
    return this.request<Pricing>(`/api/plans/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePricing(id: string): Promise<void> {
    return this.request<void>(`/api/plans/pricing/${id}`, {
      method: 'DELETE',
    });
  }

  // Add-on methods
  async getAddOns(filters?: {
    category?: string;
    appId?: string;
    planId?: string;
    isActive?: boolean;
  }): Promise<AddOn[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.appId) params.append('appId', filters.appId);
    if (filters?.planId) params.append('planId', filters.planId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    
    const query = params.toString();
    return this.request<AddOn[]>(`/api/addons${query ? `?${query}` : ''}`);
  }

  async getAddOnById(id: string): Promise<AddOn> {
    return this.request<AddOn>(`/api/addons/${id}`);
  }

  async getAvailableAddOns(organizationId: string): Promise<AddOn[]> {
    return this.request<AddOn[]>(`/api/addons/available/${organizationId}`);
  }

  async getOrganizationAddOns(organizationId: string): Promise<any[]> {
    return this.request<any[]>(`/api/addons/organization/${organizationId}`);
  }

  async createAddOn(data: {
    name: string;
    slug: string;
    description?: string;
    category: string;
    appId?: string;
    planId?: string;
    configuration: any;
    pricing: any;
    isActive?: boolean;
    isRecurring?: boolean;
  }): Promise<AddOn> {
    return this.request<AddOn>('/api/addons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAddOn(id: string, data: Partial<{
    name: string;
    slug: string;
    description?: string;
    category: string;
    appId?: string;
    planId?: string;
    configuration: any;
    pricing: any;
    isActive?: boolean;
    isRecurring?: boolean;
  }>): Promise<AddOn> {
    return this.request<AddOn>(`/api/addons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAddOn(id: string): Promise<void> {
    return this.request<void>(`/api/addons/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment methods
  async createPaymentOrder(data: {
    organizationId?: string;
    planId: string;
    pricingId: string;
    currency?: string;
    notes?: Record<string, string>;
  }): Promise<{
    success: boolean;
    order: {
      id: string;
      amount: number;
      currency: string;
      receipt: string;
      status: string;
    };
  }> {
    return this.request('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{
    success: boolean;
    message: string;
    payment?: any;
  }> {
    return this.request('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPaymentHistory(organizationId?: string): Promise<any[]> {
    const endpoint = organizationId 
      ? `/api/payments/history?organizationId=${organizationId}`
      : '/api/payments/history';
    return this.request<any[]>(endpoint);
  }

  async getPaymentById(paymentId: string): Promise<any> {
    return this.request<any>(`/api/payments/${paymentId}`);
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

  async bulkAssignApps(data: {
    appIds: string[];
    userIds: string[];
    quota?: number;
    expiresAt?: string;
  }): Promise<{
    success: boolean;
    summary: {
      total: number;
      successful: number;
      failed: number;
      skipped: number;
    };
    results: {
      successful: Array<{
        appId: string;
        userId: string;
        action: 'created' | 'updated';
        access: any;
      }>;
      failed: Array<{
        appId: string;
        userId: string;
        error: string;
      }>;
      skipped: Array<{
        appId: string;
        userId: string;
        reason: string;
      }>;
    };
  }> {
    return this.request('/api/apps/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(data),
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
    samlEnabled?: boolean;
    samlConfig?: {
      entityId?: string;
      acsUrl?: string;
      sloUrl?: string;
    };
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

  // Initiate SAML SSO for an app (returns HTML that auto-submits SAML form)
  async initiateSamlSSO(appSlug: string): Promise<Response> {
    const url = `${this.baseURL}/api/apps/${appSlug}/saml/sso`;
    const token = this.getToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to initiate SAML SSO' }));
      throw new Error(error.error || 'Failed to initiate SAML SSO');
    }

    return response;
  }

  // SAML Configuration methods
  async getSamlConfig(): Promise<any> {
    return this.request('/api/saml/config');
  }

  async configureSaml(config: {
    entityId: string;
    ssoUrl: string;
    sloUrl?: string;
    certificate: string;
    privateKey?: string; // Private key for signing (required when signAssertions is true)
    nameIdFormat?: string;
    signRequests?: boolean;
    signAssertions?: boolean;
    encryptAssertions?: boolean;
  }): Promise<any> {
    return this.request('/api/saml/config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async enableSaml(enabled: boolean): Promise<{ success: boolean; enabled: boolean }> {
    return this.request('/api/saml/enable', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  }

  async updateAppSamlConfig(appSlug: string, config: {
    samlEnabled?: boolean;
    samlConfig?: {
      entityId?: string;
      acsUrl?: string;
      sloUrl?: string;
    };
  }): Promise<any> {
    return this.request(`/api/apps/${appSlug}/saml/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
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

  // PIN methods
  async setupPIN(pin: string): Promise<{ message: string }> {
    return this.request('/api/auth/pin/setup', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async updatePIN(pin: string): Promise<{ message: string }> {
    return this.request('/api/auth/pin/update', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async verifyPIN(pin: string): Promise<{ message: string; verified: boolean }> {
    try {
      return await this.request<{ message: string; verified: boolean }>('/api/auth/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
    } catch (error: any) {
      // Re-throw with response data for better error handling
      if (error.response?.data) {
        const apiError = new Error(error.response.data.message || 'PIN verification failed') as any;
        apiError.response = error.response;
        throw apiError;
      }
      throw error;
    }
  }

  async disablePIN(): Promise<{ message: string }> {
    return this.request('/api/auth/pin/disable', {
      method: 'POST',
    });
  }

  async getPINStatus(): Promise<{ pinEnabled: boolean; hasPIN: boolean }> {
    return this.request('/api/auth/pin/status');
  }

  async updateActivity(): Promise<{ message: string }> {
    return this.request('/api/auth/activity', {
      method: 'POST',
    });
  }

  async unlockAccount(password: string): Promise<{ message: string }> {
    return this.request('/api/auth/unlock-account', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  async requestUnlockEmail(email: string): Promise<{ message: string }> {
    return this.request('/api/auth/request-unlock-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async unlockAccountWithToken(token: string): Promise<{ message: string; unlocked: boolean; alreadyUnlocked?: boolean }> {
    return this.request('/api/auth/unlock-account-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Support Ticket methods
  async createSupportTicket(data: {
    userId: string;
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    category?: 'technical' | 'billing' | 'feature-request' | 'bug-report' | 'general';
  }): Promise<any> {
    return this.request('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSupportTickets(filters?: {
    status?: string;
    priority?: string;
    category?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.category) queryParams.append('category', filters.category);
    
    const query = queryParams.toString();
    return this.request(`/api/support/tickets${query ? `?${query}` : ''}`);
  }

  async getSupportTicket(id: string): Promise<any> {
    return this.request(`/api/support/tickets/${id}`);
  }

  async updateSupportTicket(id: string, data: {
    status?: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<any> {
    return this.request(`/api/support/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createSupportResponse(ticketId: string, message: string): Promise<any> {
    return this.request(`/api/support/tickets/${ticketId}/responses`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getSupportResponses(ticketId: string): Promise<any[]> {
    return this.request(`/api/support/tickets/${ticketId}/responses`);
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
