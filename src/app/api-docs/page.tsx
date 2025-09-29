"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { ResponsiveContainer, ResponsiveGrid } from '@/components/layout/ResponsiveLayout';
import { 
  CodeBracketIcon,
  DocumentTextIcon,
  PlayIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CpuChipIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CloudIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import './api-docs.css';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  category: string;
  requiresAuth: boolean;
}

interface ApiCategory {
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
  color: string;
  icon: string;
  heroIcon: any;
}

export default function ApiDocumentationPage() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ApiCategory | null>(null);
  const [showAllEndpoints, setShowAllEndpoints] = useState(false);
  const [endpointSearch, setEndpointSearch] = useState('');

  useEffect(() => {
    loadApiDocumentation();
  }, []);

  const loadApiDocumentation = () => {
    setIsLoading(true);
    setError(null);

    // Comprehensive API documentation data
    const apiCategories: ApiCategory[] = [
      {
        name: 'SSO Portal',
        description: 'Identity & Access Master - Authentication, user management, roles & permissions, and app management',
        color: '#3b82f6',
        icon: '🔐',
        heroIcon: ShieldCheckIcon,
        endpoints: [
          {
            method: 'POST',
            path: '/api/sso/auth/register',
            description: 'Create new organization account + admin',
            category: 'SSO Portal',
            requiresAuth: false
          },
          {
            method: 'POST',
            path: '/api/sso/auth/login',
            description: 'Authenticate user with email and password',
            category: 'SSO Portal',
            requiresAuth: false
          },
          {
            method: 'POST',
            path: '/api/sso/users',
            description: 'Add user to organization (Admin only)',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/sso/users',
            description: 'List organization users',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'PATCH',
            path: '/api/sso/users/:id',
            description: 'Update user info/role/status',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'DELETE',
            path: '/api/sso/users/:id',
            description: 'Remove user from organization',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/sso/roles',
            description: 'List available roles',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/sso/roles',
            description: 'Create custom role',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/sso/permissions/assign',
            description: 'Assign permissions to user for specific app',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/sso/apps',
            description: 'Register a new app (Drive/Mail/Connect)',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/sso/apps',
            description: 'List available apps',
            category: 'SSO Portal',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/sso/apps/assign',
            description: 'Assign app access to user',
            category: 'SSO Portal',
            requiresAuth: true
          }
        ]
      },
      {
        name: 'HR Module',
        description: 'Human Resources management with SSO integration and organizational structure',
        color: '#10b981',
        icon: '👥',
        heroIcon: UserGroupIcon,
        endpoints: [
          {
            method: 'POST',
            path: '/api/hr/sync/user',
            description: 'Sync user data from SSO system',
            category: 'HR Module',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/hr/users/:ssoUserId/profile',
            description: 'Add department/designation to user profile',
            category: 'HR Module',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/hr/users/:ssoUserId',
            description: 'Get HR details for a user',
            category: 'HR Module',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/hr/departments',
            description: 'List all departments',
            category: 'HR Module',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/hr/departments',
            description: 'Create new department',
            category: 'HR Module',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/hr/designations',
            description: 'List all designations',
            category: 'HR Module',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/hr/designations',
            description: 'Create new designation',
            category: 'HR Module',
            requiresAuth: true
          }
        ]
      },
      {
        name: 'Drive',
        description: 'File storage and management system with user access control',
        color: '#f59e0b',
        icon: '💾',
        heroIcon: CloudIcon,
        endpoints: [
          {
            method: 'POST',
            path: '/api/drive/users/sync',
            description: 'Sync new user from SSO with storage quota',
            category: 'Drive',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/drive/files',
            description: 'Upload new file',
            category: 'Drive',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/drive/files/:id',
            description: 'Download file or view metadata',
            category: 'Drive',
            requiresAuth: true
          },
          {
            method: 'PATCH',
            path: '/api/drive/files/:id',
            description: 'Update file permissions or metadata',
            category: 'Drive',
            requiresAuth: true
          },
          {
            method: 'DELETE',
            path: '/api/drive/files/:id',
            description: 'Delete file permanently',
            category: 'Drive',
            requiresAuth: true
          }
        ]
      },
      {
        name: 'Mail',
        description: 'Email system with mailbox management and messaging',
        color: '#8b5cf6',
        icon: '📧',
        heroIcon: EnvelopeIcon,
        endpoints: [
          {
            method: 'POST',
            path: '/api/mail/users/sync',
            description: 'Sync user from SSO with mailbox quota',
            category: 'Mail',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/mail/send',
            description: 'Send email message',
            category: 'Mail',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/mail/inbox',
            description: 'Get inbox messages',
            category: 'Mail',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/mail/sent',
            description: 'Get sent messages',
            category: 'Mail',
            requiresAuth: true
          },
          {
            method: 'DELETE',
            path: '/api/mail/message/:id',
            description: 'Delete email message',
            category: 'Mail',
            requiresAuth: true
          }
        ]
      },
      {
        name: 'Connect',
        description: 'Communication platform with chat, video calls, and collaboration features',
        color: '#ef4444',
        icon: '💬',
        heroIcon: ChatBubbleLeftRightIcon,
        endpoints: [
          {
            method: 'POST',
            path: '/api/connect/users/sync',
            description: 'Sync user from SSO for communication access',
            category: 'Connect',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/connect/messages',
            description: 'Send message to channel',
            category: 'Connect',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/connect/messages/:channelId',
            description: 'Get channel messages',
            category: 'Connect',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/connect/call/start',
            description: 'Start video/audio call',
            category: 'Connect',
            requiresAuth: true
          },
          {
            method: 'POST',
            path: '/api/connect/call/end',
            description: 'End active call',
            category: 'Connect',
            requiresAuth: true
          },
          {
            method: 'GET',
            path: '/api/connect/call/history',
            description: 'Get call history',
            category: 'Connect',
            requiresAuth: true
          }
        ]
      },
      {
        name: 'System Health',
        description: 'System monitoring, health checks, and operational endpoints',
        color: '#6b7280',
        icon: '📊',
        heroIcon: ChartBarIcon,
        endpoints: [
          {
            method: 'GET',
            path: '/health',
            description: 'Check API health status',
            category: 'System Health',
            requiresAuth: false
          },
          {
            method: 'GET',
            path: '/api/version',
            description: 'Get API version information',
            category: 'System Health',
            requiresAuth: false
          },
          {
            method: 'GET',
            path: '/api/dashboard/stats',
            description: 'Get dashboard statistics',
            category: 'System Health',
            requiresAuth: true
          }
        ]
      }
    ];

    setTimeout(() => {
      setCategories(apiCategories);
      setIsLoading(false);
    }, 1000);
  };

  const handleSwaggerRedirect = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    window.open(`${apiUrl}/api-docs`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColorClass = (method: string) => {
    switch (method) {
      case 'GET': return 'api-docs-method-get';
      case 'POST': return 'api-docs-method-post';
      case 'PUT': return 'api-docs-method-put';
      case 'DELETE': return 'api-docs-method-delete';
      default: return 'api-docs-method-default';
    }
  };

  if (isLoading) {
    return (
      <ResponsiveContainer className="p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </ResponsiveContainer>
    );
  }

  return (
    <div className="api-docs-container" style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="api-docs-header">
        <div className="api-docs-header-content">
          <div className="api-docs-title-section">
            <div className="api-docs-title-row">
              <div className="api-docs-icon">
                <CodeBracketIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="api-docs-title">
                  API Documentation
                </h1>
                <div className="api-docs-subtitle">
                  <span className="api-docs-badge">Live</span>
                  <span>•</span>
                  <span>REST API v1.0</span>
                  <span>•</span>
                  <span>JWT Authentication</span>
                </div>
              </div>
            </div>
            <p className="api-docs-description">
              Complete API reference for Cynayd Workspace with interactive testing, 
              comprehensive examples, and real-time validation.
            </p>
          </div>
          <div className="api-docs-actions">
            <Button
              onClick={handleSwaggerRedirect}
              variant="outline"
              className="api-docs-action-button api-docs-action-button-outline flex items-center gap-2"
            >
              <PlayIcon className="w-5 h-5" />
              Interactive Testing
            </Button>
            <Button
              onClick={handleSwaggerRedirect}
              variant="default"
              className="api-docs-action-button api-docs-action-button-primary flex items-center gap-2"
            >
              <ArrowTopRightOnSquareIcon className="w-5 h-5" />
              Open Swagger UI
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* API Overview */}
      <div className="api-docs-overview">
        <div className="api-docs-overview-header">
          <div className="api-docs-overview-icon">
            <DocumentTextIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="api-docs-overview-title">API Overview</h2>
            <p className="api-docs-overview-subtitle">Comprehensive statistics and capabilities</p>
          </div>
        </div>
        <div className="api-docs-stats-grid">
          <div className="api-docs-stat-card">
            <div className="api-docs-stat-icon api-docs-stat-blue">
              <span className="api-docs-stat-number">
                {categories.reduce((total, cat) => total + cat.endpoints.length, 0)}
              </span>
            </div>
            <div className="api-docs-stat-label">Total Endpoints</div>
            <div className="api-docs-stat-description">REST API calls</div>
          </div>
          <div className="api-docs-stat-card">
            <div className="api-docs-stat-icon api-docs-stat-green">
              <span className="api-docs-stat-number">
                {categories.length}
              </span>
            </div>
            <div className="api-docs-stat-label">API Categories</div>
            <div className="api-docs-stat-description">Organized modules</div>
          </div>
          <div className="api-docs-stat-card">
            <div className="api-docs-stat-icon api-docs-stat-purple">
              <span className="api-docs-stat-number">REST</span>
            </div>
            <div className="api-docs-stat-label">API Type</div>
            <div className="api-docs-stat-description">Representational</div>
          </div>
          <div className="api-docs-stat-card">
            <div className="api-docs-stat-icon api-docs-stat-orange">
              <span className="api-docs-stat-number">JWT</span>
            </div>
            <div className="api-docs-stat-label">Authentication</div>
            <div className="api-docs-stat-description">Token-based</div>
          </div>
        </div>
      </div>

      {/* API Categories */}
      <div className="api-docs-categories-grid">
        {categories.map((category) => (
          <div key={category.name} className="api-docs-category-card" style={{ borderLeftColor: category.color }}>
            <div className="api-docs-category-header">
              <div 
                className="api-docs-category-icon"
                style={{ backgroundColor: category.color }}
              >
                <category.heroIcon className="w-7 h-7" />
              </div>
              <div className="api-docs-category-content">
                <h3 className="api-docs-category-title">
                  {category.name}
                </h3>
                <div className="api-docs-category-meta">
                  <span className="api-docs-category-badge">
                    {category.endpoints.length} endpoints
                  </span>
                  <span className="api-docs-category-status"></span>
                </div>
                <p className="api-docs-category-description">
                  {category.description}
                </p>
              </div>
            </div>

            <div className="api-docs-category-endpoints">
              {category.endpoints.slice(0, 4).map((endpoint, index) => (
                <div 
                  key={index}
                  className="api-docs-endpoint-item"
                  onClick={() => setSelectedEndpoint(endpoint)}
                >
                  <div className="api-docs-endpoint-left">
                    <span className={`api-docs-endpoint-method ${getMethodColorClass(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <span className="api-docs-endpoint-path">
                      {endpoint.path}
                    </span>
                  </div>
                  <div className="api-docs-endpoint-right">
                    {endpoint.requiresAuth && (
                      <span className="api-docs-auth-badge">🔒 Auth</span>
                    )}
                    <span className="api-docs-endpoint-arrow">→</span>
                  </div>
                </div>
              ))}
              
              {category.endpoints.length > 4 && (
                <div className="api-docs-more-endpoints">
                  +{category.endpoints.length - 4} more
                </div>
              )}
            </div>

            <div className="api-docs-category-actions">
              <Button
                variant="outline"
                className="api-docs-action-button api-docs-action-button-outline"
                onClick={() => {
                  setSelectedCategory(category);
                  setShowAllEndpoints(true);
                  setEndpointSearch('');
                }}
              >
                View All Endpoints
              </Button>
              <Button
                variant="default"
                className="api-docs-action-button api-docs-action-button-primary"
                style={{ 
                  background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                }}
                onClick={handleSwaggerRedirect}
              >
                Try in Swagger
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Start Guide */}
      <div className="api-docs-quick-start">
        <div className="api-docs-quick-start-header">
          <div className="api-docs-quick-start-icon">
            <PlayIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="api-docs-quick-start-title">Quick Start Guide</h2>
            <p className="api-docs-quick-start-subtitle">Get up and running with the API in minutes</p>
          </div>
        </div>
        <div className="api-docs-quick-start-content">
          <div className="api-docs-quick-start-step">
            <h3 className="api-docs-quick-start-step-header">
              <span className="api-docs-quick-start-step-number api-docs-step-blue">1</span>
              SSO Registration & Authentication
            </h3>
            <div className="api-docs-code-block">
              <div className="api-docs-code-header">
                <span className="api-docs-code-title">POST /api/sso/auth/register</span>
                <button 
                  onClick={() => copyToClipboard(`curl -X POST http://localhost:4000/api/sso/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"name": "John Doe", "email": "john@corp.com", "organizationName": "Tech Corp", "organizationSlug": "tech-corp", "password": "Secret@123"}'`)}
                  className="api-docs-code-copy"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
              <pre className="api-docs-code-content">{`{
  "name": "John Doe",
  "email": "john@corp.com",
  "organizationName": "Tech Corp",
  "organizationSlug": "tech-corp",
  "password": "Secret@123"
}`}</pre>
            </div>
            <div className="api-docs-code-block" style={{ marginTop: '1rem' }}>
              <div className="api-docs-code-header">
                <span className="api-docs-code-title">Response</span>
              </div>
              <pre className="api-docs-code-content">{`{
  "userId": "uuid-123",
  "organizationId": "org-001",
  "token": "jwt-token-here"
}`}</pre>
            </div>
          </div>
          
          <div className="api-docs-quick-start-step">
            <h3 className="api-docs-quick-start-step-header">
              <span className="api-docs-quick-start-step-number api-docs-step-green">2</span>
              User Management & Permissions
            </h3>
            <div className="api-docs-code-block">
              <div className="api-docs-code-header">
                <span className="api-docs-code-title">POST /api/sso/permissions/assign</span>
                <button 
                  onClick={() => copyToClipboard(`curl -X POST http://localhost:4000/api/sso/permissions/assign \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"userId": "uuid-123", "appId": "drive", "permissions": ["read", "write"]}'`)}
                  className="api-docs-code-copy"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
              <pre className="api-docs-code-content">{`{
  "userId": "uuid-123",
  "appId": "drive",
  "permissions": ["read", "write"]
}`}</pre>
            </div>
          </div>

          <div className="api-docs-quick-start-step">
            <h3 className="api-docs-quick-start-step-header">
              <span className="api-docs-quick-start-step-number api-docs-step-purple">3</span>
              Module Integration
            </h3>
            <div className="api-docs-code-block">
              <div className="api-docs-code-header">
                <span className="api-docs-code-title">POST /api/drive/users/sync</span>
                <button 
                  onClick={() => copyToClipboard(`curl -X POST http://localhost:4000/api/drive/users/sync \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"ssoUserId": "uuid-123", "organizationId": "org-001", "quota": 10737418240}'`)}
                  className="api-docs-code-copy"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
              <pre className="api-docs-code-content">{`{
  "ssoUserId": "uuid-123",
  "organizationId": "org-001",
  "quota": 10737418240
}`}</pre>
            </div>
            <div className="api-docs-code-block" style={{ marginTop: '1rem' }}>
              <div className="api-docs-code-header">
                <span className="api-docs-code-title">POST /api/hr/users/&#123;ssoUserId&#125;/profile</span>
                <button 
                  onClick={() => copyToClipboard(`curl -X POST http://localhost:4000/api/hr/users/uuid-123/profile \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{"department": "Finance", "designation": "Sr. Analyst", "status": "active"}'`)}
                  className="api-docs-code-copy"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                </button>
              </div>
              <pre className="api-docs-code-content">{`{
  "department": "Finance",
  "designation": "Sr. Analyst",
  "status": "active"
}`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* API Interaction Diagram */}
      <div className="api-docs-diagram">
        <div className="api-docs-diagram-header">
          <div className="api-docs-diagram-icon">
            <ChartBarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="api-docs-diagram-title">API Interaction Flow</h2>
            <p className="api-docs-diagram-subtitle">How modules interact and communicate with each other</p>
          </div>
        </div>
        <div className="api-docs-diagram-content">
          <div className="api-docs-diagram-visual">
            <div className="api-docs-diagram-node api-docs-diagram-sso">
              <div className="api-docs-diagram-node-icon">🔐</div>
              <div className="api-docs-diagram-node-title">SSO Portal</div>
              <div className="api-docs-diagram-node-subtitle">Auth + Roles</div>
            </div>
            <div className="api-docs-diagram-connections">
              <div className="api-docs-diagram-connection api-docs-diagram-connection-1"></div>
              <div className="api-docs-diagram-connection api-docs-diagram-connection-2"></div>
              <div className="api-docs-diagram-connection api-docs-diagram-connection-3"></div>
            </div>
            <div className="api-docs-diagram-modules">
              <div className="api-docs-diagram-module api-docs-diagram-hr">
                <div className="api-docs-diagram-module-icon">👥</div>
                <div className="api-docs-diagram-module-title">HR</div>
                <div className="api-docs-diagram-module-subtitle">Dept/Des</div>
              </div>
              <div className="api-docs-diagram-module api-docs-diagram-drive">
                <div className="api-docs-diagram-module-icon">💾</div>
                <div className="api-docs-diagram-module-title">Drive</div>
                <div className="api-docs-diagram-module-subtitle">Storage</div>
              </div>
              <div className="api-docs-diagram-module api-docs-diagram-mail">
                <div className="api-docs-diagram-module-icon">📧</div>
                <div className="api-docs-diagram-module-title">Mail</div>
                <div className="api-docs-diagram-module-subtitle">Mailbox</div>
              </div>
            </div>
            <div className="api-docs-diagram-connect-connections">
              <div className="api-docs-diagram-connect-connection api-docs-diagram-connect-connection-1"></div>
              <div className="api-docs-diagram-connect-connection api-docs-diagram-connect-connection-2"></div>
            </div>
            <div className="api-docs-diagram-connect">
              <div className="api-docs-diagram-connect-icon">💬</div>
              <div className="api-docs-diagram-connect-title">Connect</div>
              <div className="api-docs-diagram-connect-subtitle">Chat / Calls</div>
            </div>
          </div>
          <div className="api-docs-diagram-description">
            <p>
              The SSO Portal serves as the central identity and access management system. All modules (HR, Drive, Mail, Connect) 
              integrate with SSO for user authentication and authorization. The Connect module provides communication capabilities 
              that can be leveraged by other modules for notifications and collaboration features.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <div className="api-docs-footer-grid">
        <div className="api-docs-footer-card api-docs-footer-security">
          <div className="api-docs-footer-card-header">
            <div className="api-docs-footer-card-icon api-docs-footer-security-icon">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <h3 className="api-docs-footer-card-title">Security</h3>
          </div>
          <p className="api-docs-footer-card-description">
            All API endpoints are secured with JWT authentication and rate limiting.
          </p>
          <ul className="api-docs-footer-card-list">
            <li>• JWT token-based authentication</li>
            <li>• Rate limiting protection</li>
            <li>• HTTPS encryption</li>
            <li>• Input validation</li>
          </ul>
        </div>

        <div className="api-docs-footer-card api-docs-footer-support">
          <div className="api-docs-footer-card-header">
            <div className="api-docs-footer-card-icon api-docs-footer-support-icon">
              <GlobeAltIcon className="w-5 h-5" />
            </div>
            <h3 className="api-docs-footer-card-title">Support</h3>
          </div>
          <p className="api-docs-footer-card-description">
            Need help? We're here to assist you with API integration.
          </p>
          <ul className="api-docs-footer-card-list">
            <li>• Documentation: Complete guides</li>
            <li>• Examples: Real-world use cases</li>
            <li>• Support: Email support</li>
            <li>• Community: Developer forums</li>
          </ul>
        </div>

        <div className="api-docs-footer-card api-docs-footer-integration">
          <div className="api-docs-footer-card-header">
            <div className="api-docs-footer-card-icon api-docs-footer-integration-icon">
              <CpuChipIcon className="w-5 h-5" />
            </div>
            <h3 className="api-docs-footer-card-title">Integration</h3>
          </div>
          <p className="api-docs-footer-card-description">
            Easy integration with your existing applications and workflows.
          </p>
          <ul className="api-docs-footer-card-list">
            <li>• RESTful API design</li>
            <li>• JSON responses</li>
            <li>• SDKs available</li>
            <li>• Webhook support</li>
          </ul>
        </div>
      </div>

      {/* Endpoint Details Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-lg ${getMethodColor(selectedEndpoint.method)}`}>
                    {selectedEndpoint.method}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 font-mono">
                    {selectedEndpoint.path}
                  </h3>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedEndpoint(null)}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                    Description
                  </h4>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {selectedEndpoint.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-orange-600" />
                    Authentication
                  </h4>
                  <div className={`p-4 rounded-lg ${selectedEndpoint.requiresAuth ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
                    <p className={`font-medium ${selectedEndpoint.requiresAuth ? 'text-orange-800' : 'text-green-800'}`}>
                      {selectedEndpoint.requiresAuth ? '🔒 Authentication Required' : '🔓 No Authentication Required'}
                    </p>
                    <p className={`text-sm mt-1 ${selectedEndpoint.requiresAuth ? 'text-orange-600' : 'text-green-600'}`}>
                      {selectedEndpoint.requiresAuth 
                        ? 'Include JWT token in Authorization header' 
                        : 'This endpoint can be accessed without authentication'
                      }
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CodeBracketIcon className="w-5 h-5 text-purple-600" />
                    Example Request
                  </h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">{selectedEndpoint.method} {selectedEndpoint.path}</span>
                      <button 
                        onClick={() => copyToClipboard(`curl -X ${selectedEndpoint.method} http://localhost:4000${selectedEndpoint.path} \\
  -H "Content-Type: application/json" \\
  ${selectedEndpoint.requiresAuth ? '-H "Authorization: Bearer YOUR_JWT_TOKEN" \\' : ''}
  -d '{"example": "data"}'`)}
                        className="text-gray-400 hover:text-white"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <pre>{`${selectedEndpoint.method} ${selectedEndpoint.path}
Content-Type: application/json
${selectedEndpoint.requiresAuth ? 'Authorization: Bearer <jwt-token>' : ''}

{
  "example": "data"
}`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-green-600" />
                    Try This Endpoint
                  </h4>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-blue-800 mb-3">
                      Test this endpoint directly in Swagger UI with interactive documentation.
                    </p>
                    <Button
                      variant="default"
                      onClick={() => {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                        window.open(`${apiUrl}/api-docs`, '_blank');
                      }}
                      className="flex items-center gap-2"
                    >
                      <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      Open in Swagger UI
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-green-600" />
                    Example Response
                  </h4>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{`{
  "success": true,
  "data": {
    "example": "response"
  },
  "message": "Operation completed successfully"
}`}</pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEndpoint(null)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    window.open(`${apiUrl}/api-docs`, '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Try in Swagger UI
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Category Endpoints Modal */}
      {selectedCategory && showAllEndpoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedCategory.color }}
                  >
                    <selectedCategory.heroIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {selectedCategory.name}
                    </h3>
                    <p className="text-gray-600">
                      {selectedCategory.endpoints.length} endpoints available
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowAllEndpoints(false);
                  }}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600 mb-6">
                  {selectedCategory.description}
                </p>
                
                {/* Search Input */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search endpoints..."
                    value={endpointSearch}
                    onChange={(e) => setEndpointSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Results Count */}
                {endpointSearch && (
                  <div className="text-sm text-gray-500 mb-2">
                    {selectedCategory.endpoints.filter(endpoint => 
                      endpoint.path.toLowerCase().includes(endpointSearch.toLowerCase()) ||
                      endpoint.description.toLowerCase().includes(endpointSearch.toLowerCase()) ||
                      endpoint.method.toLowerCase().includes(endpointSearch.toLowerCase())
                    ).length} of {selectedCategory.endpoints.length} endpoints
                  </div>
                )}
                
                <div className="grid gap-4">
                  {selectedCategory.endpoints
                    .filter(endpoint => 
                      endpoint.path.toLowerCase().includes(endpointSearch.toLowerCase()) ||
                      endpoint.description.toLowerCase().includes(endpointSearch.toLowerCase()) ||
                      endpoint.method.toLowerCase().includes(endpointSearch.toLowerCase())
                    )
                    .map((endpoint, index) => (
                    <div 
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        setShowAllEndpoints(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-sm font-medium rounded-lg ${getMethodColor(endpoint.method)}`}>
                            {endpoint.method}
                          </span>
                          <span className="font-mono text-lg font-semibold text-gray-900">
                            {endpoint.path}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {endpoint.requiresAuth && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                              🔒 Auth Required
                            </span>
                          )}
                          <span className="text-gray-400">→</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 ml-16">
                        <p className="text-gray-600">
                          {endpoint.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                            window.open(`${apiUrl}/api-docs`, '_blank');
                          }}
                          className="flex items-center gap-1 text-xs"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          Try
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowAllEndpoints(false);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
                    window.open(`${apiUrl}/api-docs`, '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  Try in Swagger UI
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

