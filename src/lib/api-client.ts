import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import type { SecuritySettingsFormState } from '@/components/security/SecuritySettingsPanel';
import { getOrCreateWebDeviceId } from '@/lib/device-identity.service';

// App types
export interface App {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  iconUrl?: string;
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

export interface SsoExchangeCodeResponse {
  success?: boolean;
  ssoToken: string;
  launchUrl: string;
  code: string;
  expiresIn: number;
  app?: { id: string; name: string; slug: string; url?: string | null };
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
  honeypot?: string;
  formLoadedAt?: number;
}

export interface LoginStartResponse {
  mode: 'password';
  code?: string;
  email?: string;
  challengeId?: string;
  nonce?: string;
  expiresAt?: string;
  pollAfterMs?: number;
  requireMobileApproval?: boolean;
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
  device_session_id?: string;
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
  mfaMethods?: string[];
  availableMethods?: string[];
  schemaVersion?: number;
  canEnroll?: boolean;
  publicReasonCodes?: string[];
  challengeId?: string;
  nonce?: string;
  mustEnrollMfa?: boolean;
  enrollmentReason?: 'policy' | 'risk' | 'org_setting';
  requestContext?: Record<string, unknown>;
  preferredChallenge?: string;
  availableChallenges?: string[];
  emailOtpSent?: boolean;
  expiresAt?: string;
  riskLevel?: string;
  riskScore?: number;
  hasPasskey?: boolean;
  passkeyFallbackAllowed?: boolean;
  passkeyMfaAllowed?: boolean;
  emailOtpFallbackAllowed?: boolean;
  backupApprovalAllowed?: boolean;
  approvalRequired?: boolean;
  bootstrapNoDevices?: boolean;
  pushDelivered?: boolean;
  pushDeliveryWarning?: string;
  /** LoginDecision v2 (optional; legacy code still sent during transition) */
  decision?: 'ALLOW' | 'CHALLENGE' | 'BLOCK' | Record<string, unknown>;
  challenges?: Array<{
    type: string;
    priority?: number;
    status?: 'pending' | 'completed' | 'skipped';
    strength?: number;
    onEnter?: string;
    riskFactors?: string[];
  }>;
  requiredChallenges?: string[];
  nextChallenge?: string | null;
  reviewId?: string;
  challengeSessionId?: string;
  riskReasons?: string[];
  retryAfterSeconds?: number;
  hardBlockReasons?: string[];
  pollAfterMs?: number;
  block?: { code?: string; message?: string };
}

function throwMfaRequired(response: AuthResponse): never {
  const mfaError = new Error('MFA required') as Error & {
    response: { data: Partial<AuthResponse> & { code: string } };
  };
  mfaError.response = {
    data: {
      message: response.message,
      code: response.code!,
      userId: response.userId,
      email: response.email,
      mfaMethods: response.mfaMethods,
      emailOtpSent: response.emailOtpSent,
      challengeId: response.challengeId,
      nonce: response.nonce,
      preferredChallenge: response.preferredChallenge,
      availableChallenges: response.availableChallenges,
    },
  };
  throw mfaError;
}

export interface PinLock {
  pinEnabled: boolean;
  hasPIN: boolean;
  requiresPin: boolean;
  unlocked: boolean;
  lastActivity?: string | Date | null;
  inactivityTimeoutMs?: number;
  accountLocked?: boolean;
  lockedUntil?: string;
}

export interface LogoutResult {
  redirected: boolean;
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
  pinLock?: PinLock;
}

/** POST /api/users body (password only on create, not on User entity) */
export type CreateUserInput = Partial<User> & { password?: string };

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

export interface SecurityReview {
  id: string;
  userId: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  riskReasons: string;
  ipAddress?: string | null;
  deviceId?: string | null;
  canCurrentAdminReview?: boolean;
  createdAt: string;
  expiresAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskInsightsSummaryV2 {
  contractVersion: 'v2';
  generatedAt: string;
  trackedProfiles: number;
  highRiskUsers: number;
  criticalUsers: number;
  openAnomalies: number;
  activeSessions: number;
  riskDistribution: Record<RiskLevel, number>;
}

export interface RiskInsightsTrendPointV2 {
  date: string;
  anomalies: number;
  highOrCriticalProfiles: number;
}

export interface RiskInsightsTrendsV2 {
  contractVersion: 'v2';
  generatedAt: string;
  windowDays: number;
  points: RiskInsightsTrendPointV2[];
}

export interface RiskInsightsProfileRow {
  id?: string;
  userId?: string;
  riskScore: number;
  riskLevel: string;
  lastCalculated?: string;
  lastLoginLocation?: string | null;
  user?: { email: string; name: string | null };
}

export interface RiskInsightsUsersV2 {
  contractVersion: 'v2';
  generatedAt: string;
  items: RiskInsightsProfileRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
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

export interface WorkingHoursDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export interface OrgLocation {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
  isDefault: boolean;
  isActive: boolean;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
  workingHours: WorkingHoursDay[];
  createdAt: string;
  updatedAt: string;
}

export interface OrgLocationsSnapshot {
  locations: OrgLocation[];
  defaultLocationId: string | null;
  defaultTimezone: string;
}

export interface CreateOrgLocationInput {
  name: string;
  timezone: string;
  isDefault?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phoneNumber?: string;
  workingHours?: WorkingHoursDay[];
}

export interface UpdateOrgLocationInput {
  name?: string;
  timezone?: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  phoneNumber?: string | null;
}

export interface UserSettings {
  profile: {
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
    timezone: string;
    language: string;
    primaryLocationId?: string | null;
    effectiveTimezone?: string;
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
    defaultLocationId?: string | null;
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
  private cookieSessionActive = false;
  private stepUpToken: string | null = null;
  private stepUpTokenExpiresAt = 0;
  private sessionInvalidatedHandler: (() => void) | null = null;
  private refreshInFlight: Promise<boolean> | null = null;
  private static readonly SESSION_ID_KEY = 'login_session_id';
  private static readonly STEP_UP_TTL_MS = 5 * 60 * 1000;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.authToken = null;
    this.clearLegacyStoredTokens();
  }

  /** In-memory token for immediate post-login requests; session auth uses httpOnly cookies. */
  private getToken(): string | null {
    return this.authToken;
  }

  private setInMemoryToken(token: string): void {
    this.authToken = token;
  }

  private clearLegacyStoredTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /** Optional in-memory token (e.g. magic link); cookies remain the source of truth. */
  storeAuthToken(token: string): void {
    this.setInMemoryToken(token);
  }

  onSessionInvalidated(handler: (() => void) | null): void {
    this.sessionInvalidatedHandler = handler;
  }

  private getStoredSessionId(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ApiClient.SESSION_ID_KEY);
    }
    return null;
  }

  private setStoredSessionId(sessionId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ApiClient.SESSION_ID_KEY, sessionId);
    }
  }

  private clearStoredSessionId(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ApiClient.SESSION_ID_KEY);
    }
  }

  private persistAuthResponse(response: Partial<AuthResponse>): void {
    if (response.accessToken) {
      this.setInMemoryToken(response.accessToken);
    }
    if (response.device_session_id) {
      this.setStoredSessionId(response.device_session_id);
    }
  }

  private clearLocalAuthState(): void {
    this.removeStoredToken();
    this.cookieSessionActive = false;
    this.stepUpToken = null;
    this.stepUpTokenExpiresAt = 0;
    this.clearMustEnrollMfa();
    this.clearStoredSessionId();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('step_up_token');
    }
  }

  private redirectToBrowserLogout(): void {
    window.location.href = `${this.baseURL}/api/auth/logout`;
  }

  private handleSessionRevoked(): void {
    if (typeof window !== 'undefined') {
      this.redirectToBrowserLogout();
      return;
    }
    this.clearLocalAuthState();
    this.sessionInvalidatedHandler?.();
  }

  private isSessionRevokedError(
    status: number,
    endpoint: string,
    errorMessage: string,
    errorData: Record<string, unknown>
  ): boolean {
    if (status !== 401) return false;
    if (
      endpoint.endsWith('/api/auth/activity') ||
      endpoint.endsWith('/api/auth/pin/verify') ||
      endpoint.includes('/api/auth/login/challenge/') ||
      endpoint.endsWith('/api/auth/login/password') ||
      endpoint.includes('/api/security-reviews/')
    ) {
      return false;
    }
    return (
      errorMessage.toLowerCase().includes('session revoked') ||
      errorMessage.toLowerCase().includes('session expired') ||
      errorData.error === 'Session revoked' ||
      errorData.error === 'Session expired'
    );
  }

  /** Rotate session using httpOnly refresh cookie (no JS access to refresh token). */
  async restoreSession(): Promise<boolean> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    this.refreshInFlight = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/api/auth/refresh-token`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          return false;
        }

        const data = (await response.json().catch(() => ({}))) as {
          accessToken?: string;
        };
        if (data.accessToken) {
          this.setInMemoryToken(data.accessToken);
        }
        this.cookieSessionActive = true;
        return true;
      } catch {
        return false;
      } finally {
        this.refreshInFlight = null;
      }
    })();

    return this.refreshInFlight;
  }

  private removeStoredToken(): void {
    this.authToken = null;
    this.clearLegacyStoredTokens();
  }

  // HTTP request helper
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowSessionRefresh = true
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

    const sessionId = this.getStoredSessionId();
    if (sessionId) {
      headers['X-Current-Session-Id'] = sessionId;
    }

    const deviceId = getOrCreateWebDeviceId();
    if (deviceId) {
      headers['X-Cynayd-Device-Id'] = deviceId;
    }

    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
      (options.method ?? 'GET').toUpperCase()
    );
    if (mutating) {
      const csrf = this.getCsrfTokenFromCookie();
      if (csrf) {
        headers['X-XSRF-TOKEN'] = csrf;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for CORS
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;

      let errorMessage =
        typeof errorData.message === 'string' ? errorData.message : '';

      if (!errorMessage && Array.isArray(errorData.error)) {
        errorMessage = (errorData.error as Array<{ message?: string; path?: string[] }>)
          .map((item) =>
            item.path?.length
              ? `${item.path.join('.')}: ${item.message ?? 'Invalid'}`
              : item.message
          )
          .filter(Boolean)
          .join('; ');
      }

      if (!errorMessage && typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      }

      if (!errorMessage) {
        errorMessage = `HTTP error! status: ${response.status}`;
      }

      if (
        this.isSessionRevokedError(
          response.status,
          endpoint,
          errorMessage,
          errorData
        )
      ) {
        this.handleSessionRevoked();
      } else if (
        allowSessionRefresh &&
        response.status === 401 &&
        !endpoint.includes('/api/auth/refresh-token') &&
        !endpoint.includes('/api/auth/login') &&
        !endpoint.includes('/api/auth/logout') &&
        !endpoint.includes('/api/auth/register') &&
        !endpoint.includes('/api/security-reviews/')
      ) {
        const restored = await this.restoreSession();
        if (restored) {
          return this.request<T>(endpoint, options, false);
        }
      }
      
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
      } catch {
        // If JSON parsing fails, return undefined for void responses
        return undefined as any;
      }
    }

    // For non-JSON responses, return undefined
    return undefined as any;
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const start = await this.loginStart(credentials.email);
    const response = await this.loginPassword({
      challengeId: start.challengeId,
      nonce: start.nonce,
      password: credentials.password,
      rememberMe: credentials.rememberMe,
      mfaToken: credentials.mfaToken,
    });

    if (response.code === 'MFA_REQUIRED') {
      throwMfaRequired(response);
    }

    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    if (typeof window !== 'undefined') {
      if (response.mustEnrollMfa) {
        sessionStorage.setItem('must_enroll_mfa', 'true');
      } else if (
        response.code !== 'APPROVAL_REQUIRED' &&
        response.code !== 'APPROVAL_EMAIL_OTP_REQUIRED'
      ) {
        sessionStorage.removeItem('must_enroll_mfa');
      }
    }
    return response;
  }

  async loginStart(email: string): Promise<LoginStartResponse> {
    return this.request<LoginStartResponse>('/api/auth/login/start', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async loginPassword(input: {
    challengeId: string;
    nonce: string;
    password: string;
    rememberMe?: boolean;
    mfaToken?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login/password', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    if (response.code === 'MFA_REQUIRED') {
      throwMfaRequired(response);
    }

    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    if (typeof window !== 'undefined') {
      if (response.mustEnrollMfa) {
        sessionStorage.setItem('must_enroll_mfa', 'true');
      } else if (response.code !== 'APPROVAL_REQUIRED' && response.code !== 'APPROVAL_EMAIL_OTP_REQUIRED') {
        sessionStorage.removeItem('must_enroll_mfa');
      }
    }
    return response;
  }

  async approveLoginChallenge(
    challengeId: string,
    nonce: string,
    deviceId?: string
  ): Promise<{ status: string; approvedAt?: string }> {
    return this.request(`/api/auth/login/challenge/${challengeId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ nonce, deviceId }),
    });
  }

  async rejectLoginChallenge(
    challengeId: string,
    nonce: string,
    deviceId?: string,
    secureAccount?: boolean
  ): Promise<{ status: string; secureAccount?: boolean }> {
    return this.request(`/api/auth/login/challenge/${challengeId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ nonce, deviceId, secureAccount: secureAccount === true }),
    });
  }

  async getLoginChallengeStatus(
    challengeId: string,
    nonce: string,
    rememberMe?: boolean
  ): Promise<{ status: string; code?: string; expiresAt?: string; pollAfterMs?: number } & Partial<AuthResponse>> {
    const params = new URLSearchParams({ nonce });
    if (rememberMe !== undefined) {
      params.set('rememberMe', String(rememberMe));
    }
    const response = await this.request<{ status: string; code?: string; expiresAt?: string; pollAfterMs?: number } & Partial<AuthResponse>>(
      `/api/auth/login/challenge/${challengeId}?${params.toString()}`
    );
    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    return response;
  }

  async requestChallengeEmailOtp(challengeId: string, nonce: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/auth/login/challenge/${challengeId}/fallback-email-otp`, {
      method: 'POST',
      body: JSON.stringify({ nonce }),
    });
  }

  async verifyChallengeEmailOtp(input: {
    challengeId: string;
    nonce: string;
    otp: string;
    rememberMe?: boolean;
  }): Promise<{ status: string } & Partial<AuthResponse>> {
    const response = await this.request<{ status: string } & Partial<AuthResponse>>(
      `/api/auth/login/challenge/${input.challengeId}/verify-email-otp`,
      {
        method: 'POST',
        body: JSON.stringify({
          nonce: input.nonce,
          otp: input.otp,
          rememberMe: input.rememberMe,
        }),
      }
    );
    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    return response;
  }

  async startPasskeyApproval(challengeId: string, nonce: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.request<PublicKeyCredentialRequestOptionsJSON>(
      `/api/auth/login/challenge/${challengeId}/passkey-approval/start`,
      {
        method: 'POST',
        body: JSON.stringify({ nonce }),
      }
    );
  }

  async finishPasskeyApproval(input: {
    challengeId: string;
    nonce: string;
    response: AuthenticationResponseJSON;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      `/api/auth/login/challenge/${input.challengeId}/passkey-approval/finish`,
      {
        method: 'POST',
        body: JSON.stringify({
          nonce: input.nonce,
          response: input.response,
          rememberMe: input.rememberMe,
        }),
      }
    );
    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    return response;
  }

  async verifyBackupApproval(input: {
    challengeId: string;
    nonce: string;
    backupCode: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>(
      `/api/auth/login/challenge/${input.challengeId}/verify-backup-approval`,
      {
        method: 'POST',
        body: JSON.stringify({
          nonce: input.nonce,
          backupCode: input.backupCode,
          rememberMe: input.rememberMe,
        }),
      }
    );
    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    return response;
  }

  async startMfaPasskey(attemptId: string, nonce: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.request<PublicKeyCredentialRequestOptionsJSON>('/api/mfa/passkey/start', {
      method: 'POST',
      body: JSON.stringify({ attemptId, nonce }),
    });
  }

  async finishMfaPasskeyVerifyLogin(input: {
    attemptId: string;
    nonce: string;
    response: AuthenticationResponseJSON;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/mfa/passkey/verify-login', {
      method: 'POST',
      body: JSON.stringify({
        attemptId: input.attemptId,
        nonce: input.nonce,
        response: input.response,
        rememberMe: input.rememberMe,
      }),
    });
    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    return response;
  }

  getMustEnrollMfa(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('must_enroll_mfa') === 'true';
  }

  clearMustEnrollMfa(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('must_enroll_mfa');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Only set token if registration includes tokens (not for email verification flow)
    if (response.accessToken) {
      this.setInMemoryToken(response.accessToken);
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

    if (response.accessToken) {
      this.persistAuthResponse(response);
    }
    return response;
  }

  async refreshToken(refreshToken?: string): Promise<{ accessToken: string }> {
    const response = await this.request<{ accessToken: string }>(
      '/api/auth/refresh-token',
      {
        method: 'POST',
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      },
      false
    );
    
    this.setInMemoryToken(response.accessToken);
    this.cookieSessionActive = true;
    return response;
  }

  async logout(): Promise<LogoutResult> {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
      this.clearLocalAuthState();
      return { redirected: false };
    } catch {
      console.warn('Logout request failed, falling back to browser logout');
      if (typeof window !== 'undefined') {
        this.redirectToBrowserLogout();
        return { redirected: true };
      }
      this.clearLocalAuthState();
      return { redirected: false };
    }
  }

  async logoutAll(): Promise<LogoutResult> {
    try {
      await this.request('/api/auth/logoutAll', {
        method: 'POST',
      });
    } catch {
      console.warn('LogoutAll request failed, but clearing local state');
    } finally {
      this.clearLocalAuthState();
    }
    return { redirected: false };
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
    const user = await this.request<User>('/api/users/me');
    this.cookieSessionActive = true;
    return user;
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

  async createUser(data: CreateUserInput): Promise<User> {
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
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress(progress);
        }
      });

      // Track when upload completes (but before response)
      xhr.upload.addEventListener('load', () => {
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
            } catch {
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
              } catch {
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
          } catch {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || errorData.error || `HTTP error! status: ${xhr.status}`));
          } catch {
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

  /** @deprecated Use createUser — creates account and sends invitation email */
  async inviteUser(data: {
    email: string;
    name: string;
    role?: string;
    organizationId?: string;
    password?: string;
  }): Promise<User> {
    return this.createUser({
      email: data.email,
      name: data.name,
      role: (data.role?.toUpperCase() || 'USER') as User['role'],
      organizationId: data.organizationId,
      password: data.password,
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string): Promise<{ success: boolean; message: string }> {
    return this.requestWithStepUp<{ success: boolean; message: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<{
    activeUsers: number;
    totalTeams: number;
    securityEvents: number;
    recentLogins?: number;
    pendingInvitations?: number;
    systemHealth?: number;
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
    userId?: string;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    if (options?.action) params.append('action', options.action);
    if (options?.resource) params.append('resource', options.resource);
    if (options?.userId) params.append('userId', options.userId);
    if (options?.q) params.append('q', options.q);
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
    format?: 'csv' | 'json';
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate.toISOString());
    if (options?.endDate) params.append('endDate', options.endDate.toISOString());
    params.append('format', options?.format ?? 'csv');

    const headers: Record<string, string> = {};
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/api/audit-logs/export?${params.toString()}`, {
      headers,
      credentials: 'include',
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

  async getRejectedLoginSummary(days: 7 | 30 | 90 = 30): Promise<{
    total7d: number;
    total30d: number;
    secureAccountCount7d: number;
    secureAccountCount30d: number;
    topIps: Array<{ ip: string; count: number; lastSeenAt: string }>;
    daily: Array<{ date: string; count: number; secureAccountCount: number }>;
  }> {
    return this.request(`/api/security-events/rejected-logins/summary?days=${days}`);
  }

  async secureAccountFromSecurityEvent(eventId: string): Promise<{
    success: boolean;
    code: 'SECURITY_ACTION_APPLIED' | 'SECURITY_ACTION_ALREADY_APPLIED';
  }> {
    return this.request(`/api/security-events/${eventId}/secure-account`, { method: 'POST' });
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
  async exportSecurityReport(format: 'csv' | 'json'): Promise<Blob> {
    const headers: Record<string, string> = {};
    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/api/security/report?format=${format}`, {
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to export security report');
    }

    return response.blob();
  }

  // Org security (unified baseline + policies)
  async getOrgSecurity(): Promise<{
    baseline: Record<string, unknown>;
    rules: Array<Record<string, unknown>>;
    appliedTemplateIds: string[];
    templateId?: string | null;
    effectiveSsoPolicy?: Record<string, unknown>;
  }> {
    return this.request('/api/org-security');
  }

  async getSecurityTemplates(): Promise<Array<{ id: string; title: string; description: string }>> {
    return this.request('/api/org-security/templates');
  }

  async updateOrgSecurityBaseline(
    baseline: SecuritySettingsFormState | Record<string, unknown>
  ): Promise<{ baseline: Record<string, unknown> }> {
    return this.request('/api/org-security/baseline', {
      method: 'PUT',
      body: JSON.stringify(baseline),
    });
  }

  async getPendingSecurityReviews(): Promise<{
    reviews: SecurityReview[];
    adminCount: number;
    singleAdminWarning: boolean;
  }> {
    return this.request('/api/security-reviews/pending');
  }

  async approveSecurityReview(
    reviewId: string,
    approvedAction?: 'allow_once' | 'trust_device' | 'force_mfa' | 'force_password_reset'
  ): Promise<{ review: Record<string, unknown>; resumeToken?: string }> {
    return this.requestWithStepUp(`/api/security-reviews/${reviewId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvedAction }),
    });
  }

  async denySecurityReview(reviewId: string): Promise<{ review: Record<string, unknown> }> {
    return this.requestWithStepUp(`/api/security-reviews/${reviewId}/deny`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getSecurityReviewStatus(
    reviewId: string,
    nonce: string,
    loginAttemptId?: string
  ): Promise<{
    status: string;
    resumeToken?: string;
    challengeSessionId?: string;
    userId?: string;
    loginAttemptId?: string;
    pollAfterMs?: number;
    message?: string;
    code?: string;
  }> {
    const params = new URLSearchParams({ nonce });
    if (loginAttemptId) params.set('loginAttemptId', loginAttemptId);
    return this.request(`/api/security-reviews/${reviewId}/status?${params.toString()}`);
  }

  async resumeSecurityReview(input: {
    reviewId: string;
    userId: string;
    resumeToken: string;
    challengeSessionId: string;
    nonce?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse & Record<string, unknown>> {
    return this.request(`/api/security-reviews/${input.reviewId}/resume`, {
      method: 'POST',
      body: JSON.stringify({
        userId: input.userId,
        resumeToken: input.resumeToken,
        challengeSessionId: input.challengeSessionId,
        nonce: input.nonce,
        rememberMe: input.rememberMe,
      }),
    });
  }

  async applySecurityTemplate(
    templateId: string,
    params?: { countries?: string[] }
  ): Promise<{ baselineUpdated: boolean; rulesCreated: string[]; rulesUpdated: string[] }> {
    return this.request('/api/org-security/apply-template', {
      method: 'POST',
      body: JSON.stringify({ templateId, params }),
    });
  }

  /** @deprecated Use getOrgSecurity / updateOrgSecurityBaseline */
  async getSecuritySettings(): Promise<any> {
    const snapshot = await this.getOrgSecurity();
    return { organizationId: undefined, ...snapshot.baseline };
  }

  /** @deprecated Use updateOrgSecurityBaseline */
  async updateSecuritySettings(settings: any): Promise<any> {
    const result = await this.updateOrgSecurityBaseline(settings);
    return { settings: result.baseline, message: 'Security settings updated successfully' };
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
  /** System apps + current organization's apps (org admin scope) */
  async getApps(): Promise<App[]> {
    return this.request<App[]>('/api/apps');
  }

  /** All apps platform-wide — SUPER_ADMIN only */
  async getSuperAdminApps(): Promise<App[]> {
    return this.request<App[]>('/api/superadmin/apps');
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

  async getAllUserAppAccess(options?: { superAdminScope?: boolean }): Promise<UserAppAccess[]> {
    if (options?.superAdminScope) {
      return this.request<UserAppAccess[]>('/api/superadmin/apps/user-access');
    }
    return this.request<UserAppAccess[]>('/api/apps/user-access');
  }

  async createApp(appData: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    iconUrl?: string;
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
    roleTemplateId?: string;
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

  async generateSSOToken(appSlug: string): Promise<SsoExchangeCodeResponse> {
    return this.exchangeSsoCode(appSlug);
  }

  async exchangeSsoCode(appSlug: string): Promise<SsoExchangeCodeResponse> {
    return this.request<SsoExchangeCodeResponse>('/api/sso/exchange-code', {
      method: 'POST',
      body: JSON.stringify({ appSlug }),
    });
  }

  async redeemSsoCode(
    code: string,
    appSlug: string
  ): Promise<{
    success: boolean;
    ssoToken: string;
    user: User;
    app: { id: string; name: string; slug: string; url?: string | null };
  }> {
    return this.request('/api/sso/redeem-code', {
      method: 'POST',
      body: JSON.stringify({ code, appSlug }),
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

  async getAppFederation(appSlug: string): Promise<{
    app: { id: string; slug: string; authorizationMode: string; claimProviderId?: string | null; protocol: string };
    federation: { samlProviderArn?: string | null; config?: Record<string, unknown> } | null;
  }> {
    return this.request(`/api/apps/${appSlug}/federation`);
  }

  async putAppFederation(
    appSlug: string,
    body: {
      authorizationMode?: string;
      claimProviderId?: string;
      protocol?: string;
      samlProviderArn?: string | null;
      config?: Record<string, unknown>;
      enabled?: boolean;
    }
  ): Promise<unknown> {
    return this.request(`/api/apps/${appSlug}/federation`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async getAppRoleTemplates(appSlug: string): Promise<
    Array<{ id: string; roleKey: string; displayName: string; externalValue: string; isDefault: boolean }>
  > {
    return this.request(`/api/apps/${appSlug}/role-templates`);
  }

  async createAppRoleTemplate(
    appSlug: string,
    body: { roleKey: string; displayName: string; externalValue: string; isDefault?: boolean }
  ): Promise<unknown> {
    return this.request(`/api/apps/${appSlug}/role-templates`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteAppRoleTemplate(appSlug: string, templateId: string): Promise<void> {
    return this.request(`/api/apps/${appSlug}/role-templates/${templateId}`, { method: 'DELETE' });
  }

  async getClaimPreview(appSlug: string, userId: string): Promise<Record<string, unknown>> {
    return this.request(`/api/apps/${appSlug}/claim-preview?userId=${encodeURIComponent(userId)}`);
  }

  async getGroups(): Promise<Array<{ id: string; name: string; slug: string }>> {
    return this.request('/api/groups');
  }

  async createGroup(body: { name: string; slug: string; description?: string }): Promise<unknown> {
    return this.request('/api/groups', { method: 'POST', body: JSON.stringify(body) });
  }

  async getAppGroupRoles(appSlug: string): Promise<
    Array<{ groupId: string; roleTemplateId: string; group?: { name: string }; roleTemplate?: { displayName: string } }>
  > {
    return this.request(`/api/apps/${appSlug}/group-roles`);
  }

  async putAppGroupRoles(
    appSlug: string,
    mappings: Array<{ groupId: string; roleTemplateId: string }>
  ): Promise<unknown> {
    return this.request(`/api/apps/${appSlug}/group-roles`, {
      method: 'PUT',
      body: JSON.stringify({ mappings }),
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

  async getOrgLocations(): Promise<OrgLocationsSnapshot> {
    return this.request<OrgLocationsSnapshot>('/api/settings/locations');
  }

  async getOrgLocation(locationId: string): Promise<{ location: OrgLocation }> {
    return this.request<{ location: OrgLocation }>(`/api/settings/locations/${locationId}`);
  }

  async createOrgLocation(data: CreateOrgLocationInput): Promise<{ location: OrgLocation }> {
    return this.request<{ location: OrgLocation }>('/api/settings/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrgLocation(
    locationId: string,
    data: UpdateOrgLocationInput,
  ): Promise<{ location: OrgLocation }> {
    return this.request<{ location: OrgLocation }>(`/api/settings/locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrgLocation(locationId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/settings/locations/${locationId}`, {
      method: 'DELETE',
    });
  }

  async setDefaultOrgLocation(locationId: string): Promise<{ location: OrgLocation }> {
    return this.request<{ location: OrgLocation }>(
      `/api/settings/locations/${locationId}/default`,
      { method: 'PUT' },
    );
  }

  async updateOrgLocationWorkingHours(
    locationId: string,
    workingHours: WorkingHoursDay[],
  ): Promise<{ location: OrgLocation }> {
    return this.request<{ location: OrgLocation }>(
      `/api/settings/locations/${locationId}/working-hours`,
      {
        method: 'PUT',
        body: JSON.stringify({ workingHours }),
      },
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }

  // MFA methods
  async setupMFA(): Promise<{
    secret: string;
    qrCodeUrl: string;
    otpauthUrl?: string;
    backupCodes: string[];
  }> {
    return this.request('/api/mfa/setup', {
      method: 'POST',
    });
  }

  async startMfaDeviceEnrollment(backupCodes: string[]): Promise<{
    success: boolean;
    sessionId: string;
    expiresAt: string;
    push: { sent: boolean; reason?: string };
    deepLink: string;
    webFallbackUrl: string;
  }> {
    return this.request('/api/mfa/device-enrollment/start', {
      method: 'POST',
      body: JSON.stringify({ backupCodes }),
    });
  }

  async getMfaDeviceEnrollmentStatus(sessionId: string): Promise<{
    success: boolean;
    status: 'pending' | 'completed' | 'cancelled' | 'expired';
    expiresAt: string;
  }> {
    return this.request(`/api/mfa/device-enrollment/${encodeURIComponent(sessionId)}`);
  }

  async retryMfaDeviceEnrollmentPush(sessionId: string): Promise<{
    success: boolean;
    push: { sent: boolean; reason?: string };
  }> {
    return this.request(
      `/api/mfa/device-enrollment/${encodeURIComponent(sessionId)}/retry-push`,
      { method: 'POST' }
    );
  }

  async cancelMfaDeviceEnrollment(sessionId: string): Promise<{ success: boolean; status: string }> {
    return this.request(
      `/api/mfa/device-enrollment/${encodeURIComponent(sessionId)}/cancel`,
      { method: 'POST' }
    );
  }

  async verifyMFASetup(token: string): Promise<{ verified: boolean }> {
    return this.request('/api/mfa/verify-setup', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async enableMFA(
    token: string,
    backupCodes?: string[]
  ): Promise<{ message: string; accessToken?: string; mustEnrollMfa?: boolean }> {
    const response = await this.request<{
      message: string;
      accessToken?: string;
      mustEnrollMfa?: boolean;
    }>('/api/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ token, backupCodes }),
    });
    if (response.accessToken) {
      this.setInMemoryToken(response.accessToken);
    }
    if (response.mustEnrollMfa === false) {
      this.clearMustEnrollMfa();
    }
    return response;
  }

  async disableMFA(
    password: string,
    mfaToken?: string,
    mfaChallengeId?: string
  ): Promise<{ message: string }> {
    return this.request('/api/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password, mfaToken, mfaChallengeId }),
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
    methods?: string[];
  }> {
    return this.request('/api/mfa/status');
  }

  async enableEmailMFA(): Promise<{ mfaMethods: string[] }> {
    return this.request('/api/mfa/email/enable', {
      method: 'POST',
    });
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

  async verifyPIN(pin: string): Promise<{
    message: string;
    verified: boolean;
    accessToken?: string;
    unlocked?: boolean;
  }> {
    try {
      const response = await this.request<{
        message: string;
        verified: boolean;
        accessToken?: string;
        unlocked?: boolean;
      }>('/api/auth/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (response.accessToken) {
        this.setInMemoryToken(response.accessToken);
      }
      return response;
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

  async getPINStatus(): Promise<PinLock> {
    return this.request<PinLock>('/api/auth/pin/status');
  }

  async updateActivity(): Promise<{ message: string; accessToken?: string; unlocked?: boolean }> {
    const response = await this.request<{
      message: string;
      accessToken?: string;
      unlocked?: boolean;
    }>('/api/auth/activity', {
      method: 'POST',
    });
    if (response?.accessToken) {
      this.setInMemoryToken(response.accessToken);
    }
    return response;
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

  async submitContactInquiry(data: {
    name: string;
    email: string;
    company?: string;
    topic: 'general' | 'sales' | 'support' | 'partnership';
    message: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/public/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAccessPolicies(): Promise<Array<Record<string, unknown>>> {
    return this.request('/api/access-policies');
  }

  async createAccessPolicy(body: Record<string, unknown>): Promise<unknown> {
    return this.request('/api/access-policies', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async deleteAccessPolicy(id: string): Promise<void> {
    return this.request(`/api/access-policies/${id}`, { method: 'DELETE' });
  }

  async getRequiredConsents(): Promise<{ required: Array<{ purpose: string; version: string; label: string }> }> {
    return this.request('/api/privacy/consent/required');
  }

  async getUserConsents(): Promise<Array<{ purpose: string; version: string }>> {
    return this.request('/api/privacy/consent');
  }

  async grantConsent(purpose: string, version: string): Promise<unknown> {
    return this.request('/api/privacy/consent', {
      method: 'POST',
      body: JSON.stringify({ purpose, version }),
    });
  }

  async requestMagicLink(
    email: string,
    options?: { deviceBindingHash?: string }
  ): Promise<{ message: string }> {
    return this.request('/api/auth/magic-link/request', {
      method: 'POST',
      body: JSON.stringify({
        email,
        ...(options?.deviceBindingHash ? { deviceBindingHash: options.deviceBindingHash } : {}),
      }),
    });
  }

  async consumeMagicLink(input: {
    email: string;
    token: string;
    deviceBindingHash?: string;
    rememberMe?: boolean;
    mfaToken?: string;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/magic-link/consume', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async sendSessionMfaEmailCode(): Promise<{ message: string; challengeId: string }> {
    return this.request('/api/mfa/email/send', { method: 'POST' });
  }

  async sendMfaEmailCode(input?: {
    userId?: string;
    attemptId?: string;
    nonce?: string;
  }): Promise<{ message: string }> {
    if (input?.attemptId && input?.nonce) {
      return this.request('/api/auth/mfa/email/send-login', {
        method: 'POST',
        body: JSON.stringify({
          attemptId: input.attemptId,
          nonce: input.nonce,
        }),
      });
    }
    if (input?.userId) {
      return this.request('/api/auth/mfa/email/send-login', {
        method: 'POST',
        body: JSON.stringify({ userId: input.userId }),
      });
    }
    return this.request('/api/mfa/email/send', { method: 'POST' });
  }

  async completeMagicLinkLogin(input: {
    challengeId: string;
    nonce: string;
    mfaToken?: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/magic-link/complete', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getRiskInsightsDashboard(): Promise<Record<string, unknown>> {
    return this.request('/api/risk-insights/dashboard');
  }

  async getRiskInsightsSummary(windowDays?: number): Promise<RiskInsightsSummaryV2> {
    const params = new URLSearchParams();
    if (windowDays) params.set('windowDays', String(windowDays));
    const query = params.toString();
    return this.request(`/api/risk-insights/summary${query ? `?${query}` : ''}`);
  }

  async getRiskInsightsTrends(windowDays: number = 30): Promise<RiskInsightsTrendsV2> {
    const params = new URLSearchParams({ windowDays: String(windowDays) });
    return this.request(`/api/risk-insights/trends?${params.toString()}`);
  }

  async getRiskInsightsUsers(params?: {
    page?: number;
    limit?: number;
    q?: string;
    riskLevel?: 'all' | RiskLevel;
    sortBy?: 'riskScore' | 'lastCalculated';
    sortOrder?: 'asc' | 'desc';
  }): Promise<RiskInsightsUsersV2> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.q) query.set('q', params.q);
    if (params?.riskLevel) query.set('riskLevel', params.riskLevel);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    const qs = query.toString();
    return this.request(`/api/risk-insights/users${qs ? `?${qs}` : ''}`);
  }

  async getAdminSessions(): Promise<{ count: number; sessions: unknown[] }> {
    return this.request('/api/admin/sessions');
  }

  async revokeAdminSession(sessionId: string): Promise<void> {
    return this.request(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async listWebAuthnCredentials(): Promise<
    Array<{ id: string; deviceName: string | null; createdAt: string; lastUsedAt: string | null }>
  > {
    return this.request('/api/auth/webauthn/credentials');
  }

  async deleteWebAuthnCredential(id: string): Promise<void> {
    return this.request(`/api/auth/webauthn/credentials/${id}`, { method: 'DELETE' });
  }

  async updateAccessPolicy(
    id: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    return this.request(`/api/access-policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async webauthnAuthenticateStart(email: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.request<PublicKeyCredentialRequestOptionsJSON>('/api/auth/webauthn/authenticate/start', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async webauthnAuthenticateFinish(
    responseOrResume:
      | AuthenticationResponseJSON
      | {
          challengeId: string;
          nonce: string;
          mfaToken: string;
          rememberMe?: boolean;
        },
    options?: { rememberMe?: boolean }
  ): Promise<AuthResponse> {
    const body =
      'challengeId' in responseOrResume
        ? {
            challengeId: responseOrResume.challengeId,
            nonce: responseOrResume.nonce,
            mfaToken: responseOrResume.mfaToken,
            rememberMe: responseOrResume.rememberMe,
          }
        : {
            response: responseOrResume,
            rememberMe: options?.rememberMe,
          };
    return this.request<AuthResponse>('/api/auth/webauthn/authenticate/finish', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async webauthnRegisterStart(): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.request<PublicKeyCredentialCreationOptionsJSON>('/api/auth/webauthn/register/start', { method: 'POST' });
  }

  async webauthnRegisterFinish(
    response: RegistrationResponseJSON,
    deviceName?: string
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/auth/webauthn/register/finish', {
      method: 'POST',
      body: JSON.stringify({ response, deviceName }),
    });
  }

  async performStepUp(
    password: string,
    mfaToken?: string,
    mfaChallengeId?: string
  ): Promise<string> {
    const data = await this.request<{ stepUpToken: string }>('/api/auth/step-up', {
      method: 'POST',
      body: JSON.stringify({ password, mfaToken, mfaChallengeId }),
    });
    return data.stepUpToken;
  }

  getStepUpToken(): string | null {
    if (this.stepUpToken && Date.now() < this.stepUpTokenExpiresAt) {
      return this.stepUpToken;
    }
    this.stepUpToken = null;
    this.stepUpTokenExpiresAt = 0;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('step_up_token');
    }
    return null;
  }

  cacheStepUpToken(token: string): void {
    this.stepUpToken = token;
    this.stepUpTokenExpiresAt = Date.now() + ApiClient.STEP_UP_TTL_MS;
  }

  async withStepUp<T>(fn: (stepUpToken: string) => Promise<T>): Promise<T> {
    const token = this.getStepUpToken();
    if (token) {
      try {
        return await fn(token);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { code?: string } } };
        if (e.response?.data?.code !== 'STEP_UP_REQUIRED') throw err;
      }
    }
    const password = typeof window !== 'undefined'
      ? window.prompt('Enter your password to confirm this action:')
      : null;
    if (!password) throw new Error('Step-up cancelled');
    const newToken = await this.performStepUp(password);
    this.cacheStepUpToken(newToken);
    return fn(newToken);
  }

  async requestWithStepUp<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.withStepUp((stepUpToken) =>
      this.request<T>(endpoint, {
        ...options,
        headers: {
          ...(options.headers as Record<string, string>),
          'X-Step-Up-Token': stepUpToken,
        },
      })
    );
  }

  async verifyMfaEmailCode(code: string): Promise<{ valid: boolean }> {
    return this.request('/api/mfa/email/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async requestPrivacyExport(): Promise<Record<string, unknown>> {
    return this.request('/api/privacy/export');
  }

  async requestPrivacyDelete(): Promise<unknown> {
    return this.request('/api/privacy/delete-request', { method: 'POST' });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.authToken || this.cookieSessionActive;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
