"use client";

import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import { useState } from 'react';
import { Card } from '@/components/common/Card';

export default function HelpPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('getting-started');

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
      question: "How do I access my assigned products?",
      answer: "Navigate to the Dashboard and you'll see all products you have access to. Click on any product card to open it."
    },
    {
      question: "How do I change my password?",
      answer: "Go to Settings > Security and use the password change form. You'll need to enter your current password first."
    },
    {
      question: "Why can't I see certain features?",
      answer: "Feature visibility depends on your role and permissions. Contact your administrator if you need access to additional features."
    },
    {
      question: "How do I invite team members?",
      answer: "If you're an admin or manager, go to Users page and click 'Invite User' to send invitations via email."
    },
    {
      question: "How do I update my profile information?",
      answer: "Go to Profile page to update your personal information, display name, and other account details."
    },
    {
      question: "What should I do if I'm locked out of my account?",
      answer: "Use the 'Forgot Password' link on the login page to reset your password via email."
    }
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Welcome to Cynayd!</h3>
              <div className="prose max-w-none">
                <p className="text-gray-600 mb-4">
                  This guide will help you get started with using our platform effectively.
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">1. Dashboard Overview</h4>
                    <p className="text-gray-600 text-sm">
                      Your dashboard shows an overview of your assigned products, recent activity, and quick actions.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-medium text-gray-900">2. Product Access</h4>
                    <p className="text-gray-600 text-sm">
                      Click on any product card to access the product. Your access level determines what features you can use.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-medium text-gray-900">3. Profile Management</h4>
                    <p className="text-gray-600 text-sm">
                      Update your personal information, change settings, and manage your account preferences.
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
                  <h4 className="font-medium text-gray-900 mb-2">📊 Dashboard Analytics</h4>
                  <p className="text-sm text-gray-600">
                    View usage statistics, activity feeds, and performance metrics for your products.
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">👥 Team Management</h4>
                  <p className="text-sm text-gray-600">
                    Manage team members, assign roles, and control access to different products.
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">🔒 Security Controls</h4>
                  <p className="text-sm text-gray-600">
                    Monitor security events, manage permissions, and configure access controls.
                  </p>
                </Card>
                
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📧 Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Stay updated with email notifications and in-app alerts for important events.
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
