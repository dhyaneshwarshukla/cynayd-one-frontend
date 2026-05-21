"use client";

import { RegisterForm } from '@/components/auth/RegisterForm';
import { BrandLink } from '@/components/common/BrandLink';
import { LegalFooterLinks } from '@/components/legal/LegalFooterLinks';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <BrandLink name="CYNAYD" />
            <div className="text-sm text-gray-600">
              AI Workspace Platform
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start your <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CYNAYD One</span> workspace
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mail, drive, calendar, meetings, tasks and team collaboration in one secure AI-powered
              workspace — with enterprise SSO and optional self-hosting.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unified workspace apps
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                AI inside workflows
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Self-hosted or cloud
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Enterprise SSO
              </div>
            </div>
          </div>

          {/* Main Layout: Content + Form */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Content - Left Side */}
            <div className="lg:col-span-1 order-1 space-y-6">
              {/* Platform Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What You Get</h3>
                <div className="space-y-3">
                  {[
                    { name: "Mail", desc: "AI summaries & smart actions", color: "bg-emerald-600" },
                    { name: "Drive", desc: "Files & collaboration", color: "bg-violet-600" },
                    { name: "Calendar", desc: "Scheduling & workflows", color: "bg-sky-600" },
                    { name: "Connect", desc: "Team communication", color: "bg-rose-600" },
                    { name: "Tasks", desc: "Work management", color: "bg-amber-600" },
                    { name: "Meetings", desc: "Integrated video calls", color: "bg-cyan-600" },
                  ].map((app) => (
                    <div key={app.name} className="flex items-center">
                      <div className={`w-8 h-8 ${app.color} rounded-lg flex items-center justify-center mr-3`}>
                        <span className="text-white text-xs font-bold">{app.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">CYNAYD One {app.name}</h4>
                        <p className="text-xs text-gray-500">{app.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Choose CYNAYD One?</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Unified Workspace</h4>
                      <p className="text-xs text-gray-500">One platform, no app switching</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Enterprise Security</h4>
                      <p className="text-xs text-gray-500">Bank-grade protection</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Scalable Growth</h4>
                      <p className="text-xs text-gray-500">Grows with your business</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonials */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trusted by 500+ Organizations</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-blue-600 font-bold text-sm">S</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Sarah Chen</h4>
                        <p className="text-xs text-gray-500">CTO, TechCorp</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      "CYNAYD One transformed our business operations. The unified platform eliminated the need for multiple tools."
                    </p>
                    <div className="flex text-yellow-400 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <span className="text-green-600 font-bold text-sm">M</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Michael Rodriguez</h4>
                        <p className="text-xs text-gray-500">CEO, InnovateLabs</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 italic">
                      "Mail-to-task and AI summaries cut our daily coordination time significantly."
                    </p>
                    <div className="flex text-yellow-400 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">500+</div>
                    <div className="text-xs text-gray-600">Organizations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">50K+</div>
                    <div className="text-xs text-gray-600">Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">99.9%</div>
                    <div className="text-xs text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-600">24/7</div>
                    <div className="text-xs text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration Form - Right Side */}
            <div className="lg:col-span-2 order-2">
              <RegisterForm />
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 space-y-4">
            <p className="text-sm text-gray-500">
              Already have an organization account?{' '}
              <a href="/auth/login" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign in to your dashboard
              </a>
            </p>
            <LegalFooterLinks />
          </div>
        </div>
      </div>
    </div>
  );
}
