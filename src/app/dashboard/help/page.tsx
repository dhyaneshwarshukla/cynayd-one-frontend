"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useState, useEffect } from 'react';
import { Card } from '@/components/common/Card';

export default function HelpPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('getting-started');

  // Set page title
  useEffect(() => {
    document.title = 'Help & Support | CYNAYD One';
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access help documentation.</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'getting-started', name: 'Getting Started', icon: '🚀' },
    { id: 'features', name: 'Features', icon: '⭐' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
    { id: 'contact', name: 'Contact Support', icon: '📞' },
  ];

  const faqs = [
    {
      question: "How do I access my assigned apps?",
      answer: "Navigate to the Dashboard and you'll see all apps assigned to you. Click on any app card to access it. Only apps assigned to you by an administrator will be visible."
    },
    {
      question: "How do I change my password?",
      answer: "Go to Dashboard > Settings > Security and use the password change form. You'll need to enter your current password first. You can also change your password from the Profile page."
    },
    {
      question: "Can I change my email address?",
      answer: "No, email addresses can only be changed by administrators for security reasons. Contact your administrator if you need to update your email."
    },
    {
      question: "Why can't I see certain apps or features?",
      answer: "App visibility and feature access depend on your role and permissions. Regular users only see apps assigned to them. Contact your administrator if you need access to additional apps or features."
    },
    {
      question: "How do I request access to an app?",
      answer: "If you're a regular user, you can request access to apps by contacting your organization administrator. Administrators can assign apps to users from the Apps management page."
    },
    {
      question: "How do I update my profile information?",
      answer: "Go to Dashboard > Profile to update your personal information and display name. Note that email addresses cannot be changed by users."
    },
    {
      question: "What should I do if I'm locked out of my account?",
      answer: "Use the 'Forgot Password' link on the login page to reset your password via email. If you continue to have issues, contact your administrator or support."
    },
    {
      question: "How do I manage my privacy settings?",
      answer: "Go to Dashboard > Settings > Privacy to control your profile visibility, activity tracking, and data sharing preferences. You can also request a data export or delete your account from this section."
    },
    {
      question: "How do I set up Multi-Factor Authentication (MFA)?",
      answer: "Go to Dashboard > Settings > Security and click 'Enable MFA'. Follow the setup instructions to configure two-factor authentication for enhanced security."
    },
    {
      question: "What is the difference between ADMIN and SUPER_ADMIN roles?",
      answer: "ADMIN users can manage their organization's users and apps. SUPER_ADMIN users have system-wide access and can manage all organizations, system apps, and global settings."
    },
    {
      question: "How does Single Sign-On (SSO) work?",
      answer: "SSO allows you to access multiple apps with a single login. When you click on an app from your dashboard, you'll be automatically authenticated using your CYNAYD One credentials without needing to log in again."
    },
    {
      question: "Where can I see my app usage statistics?",
      answer: "You can view your app usage statistics and activity from the Dashboard. The Analytics section shows your active apps, quota usage, and recent activity."
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome to CYNAYD One!</h3>
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-4">
                  CYNAYD One is a comprehensive business ecosystem platform that provides unified access to multiple applications through Single Sign-On (SSO). This guide will help you get started with using our platform effectively.
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">1. Dashboard Overview</h4>
                    <p className="text-gray-600 text-sm">
                      Your dashboard is your central hub. It displays all apps assigned to you, your usage statistics, recent activity, and quick actions. Regular users only see apps that have been assigned to them by administrators.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900">2. App Access</h4>
                    <p className="text-gray-600 text-sm">
                      Click on any app card in your dashboard to access it. The system uses SSO to automatically authenticate you, so you don't need to log in separately for each app. Only apps assigned to you will be visible.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-gray-900">3. Profile & Settings Management</h4>
                    <p className="text-gray-600 text-sm">
                      Update your profile information, change password, configure security settings, and manage privacy preferences from the Profile and Settings pages. Note that email addresses can only be changed by administrators.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-medium text-gray-900">4. User Roles</h4>
                    <p className="text-gray-600 text-sm">
                      <strong>USER:</strong> Regular users can access assigned apps and manage their profile.<br/>
                      <strong>ADMIN:</strong> Can manage organization users and apps, assign apps to users.<br/>
                      <strong>SUPER_ADMIN:</strong> Has system-wide access to manage all organizations and system apps.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'features':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Features</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Dashboard & Analytics</h4>
                  <p className="text-sm text-gray-600">
                    View your assigned apps, usage statistics, activity feeds, and performance metrics. Track your app access, quota usage, and health scores.
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🔐 Single Sign-On (SSO)</h4>
                  <p className="text-sm text-gray-600">
                    Access all your assigned apps with a single login. No need to remember multiple passwords - seamless authentication across the platform.
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">👥 User & Organization Management</h4>
                  <p className="text-sm text-gray-600">
                    Administrators can manage users, assign apps, control access permissions, and organize teams within their organization.
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🔒 Security & Privacy</h4>
                  <p className="text-sm text-gray-600">
                    Multi-factor authentication (MFA), security event monitoring, privacy controls, activity tracking, and data export capabilities.
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📱 App Management</h4>
                  <p className="text-sm text-gray-600">
                    Administrators can create apps, assign them to users, set quotas and expiration dates, and manage app access across the organization.
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📧 Notifications & Alerts</h4>
                  <p className="text-sm text-gray-600">
                    Stay updated with email notifications, in-app alerts for important events, security warnings, and app expiration reminders.
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📈 Usage Tracking</h4>
                  <p className="text-sm text-gray-600">
                    Monitor your app usage, quota consumption, active sessions, and access patterns to optimize your workflow.
                  </p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">⚙️ Settings & Preferences</h4>
                  <p className="text-sm text-gray-600">
                    Customize your profile, configure notification preferences, manage privacy settings, and adjust security options.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        );
      case 'troubleshooting':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Common Issues</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-medium text-gray-900">Login Issues</h4>
                  <p className="text-sm text-gray-600">
                    If you can't log in, try resetting your password or clearing your browser cache.
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-medium text-gray-900">Access Denied</h4>
                  <p className="text-sm text-gray-600">
                    Contact your administrator if you're getting access denied errors for features you should have.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium text-gray-900">Performance Issues</h4>
                  <p className="text-sm text-gray-600">
                    If the platform is running slowly, try refreshing the page or checking your internet connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Support</h3>
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">📧 Email Support</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Send us an email and we'll get back to you within 24 hours.
                  </p>
                  <a 
                    href="mailto:support@cynayd.com" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Send Email
                  </a>
                </Card>
                
                <Card className="p-6">
                  <h4 className="font-medium text-gray-900 mb-4">💬 Live Chat</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Chat with our support team in real-time during business hours.
                  </p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                    Start Chat
                  </button>
                </Card>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Support Hours</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday - Friday:</span>
                    <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday:</span>
                    <span className="font-medium">10:00 AM - 4:00 PM EST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday:</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Support</h3>
              <p className="text-sm text-gray-600 mb-4">
                For critical issues affecting your business operations, contact our emergency support line.
              </p>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-800 font-medium">Emergency Hotline: 1-800-CYNAYD-1</p>
                <p className="text-red-600 text-sm">Available 24/7 for critical issues only</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <UnifiedLayout variant="dashboard"
      title="Help & Support"
      subtitle="Find answers to your questions and get the help you need"
    >
      <div className="max-w-6xl">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === section.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.name}
              </button>
            ))}
          </nav>
        </div>

        <Card className="p-6">
          {renderSectionContent()}
        </Card>
      </div>
    </UnifiedLayout>
  );
}
