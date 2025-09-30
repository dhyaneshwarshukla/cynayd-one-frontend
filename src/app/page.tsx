import { UnifiedLayout } from "@/components/layout/UnifiedLayout";

export default function HomePage() {
  return (
    <UnifiedLayout variant="landing">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CYNAYD One</span>
              <br />Complete Business Ecosystem
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              Transform your business with our comprehensive corporate platform. Manage your entire organization 
              with built-in HR, secure communication, cloud storage, video conferencing, custom app integration, 
              and business website generation - all secured with enterprise-grade SSO.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/auth/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl transform hover:scale-105"
              >
                Start Free Trial
              </a>
              <a
                href="#ecosystem"
                className="bg-white text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              >
                Explore Ecosystem
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Diagram Section */}
      <section id="ecosystem" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">CYNAYD One Ecosystem</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              A complete business platform with built-in apps, custom integrations, and website generation capabilities
            </p>
          </div>

          {/* Enhanced Ecosystem Diagram */}
          <div className="relative flex items-center justify-center h-[500px]">
            {/* Background Circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-96 h-96 rounded-full border-4 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
            </div>

            {/* Central Hub - CYNAYD One */}
            <div className="absolute z-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full w-28 h-28 flex items-center justify-center shadow-xl">
              <div className="text-center text-white">
                <div className="text-sm font-bold">CYNAYD</div>
                <div className="text-xs opacity-90">One</div>
              </div>
            </div>

            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500">
              {/* Lines to built-in apps */}
              <path
                d="M 250 250 L 250 100"
                stroke="#3B82F6"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M 250 250 L 400 250"
                stroke="#10B981"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M 250 250 L 250 400"
                stroke="#8B5CF6"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              <path
                d="M 250 250 L 100 250"
                stroke="#EF4444"
                strokeWidth="3"
                fill="none"
                className="animate-pulse"
              />
              {/* Lines to custom features */}
              <path
                d="M 250 250 L 350 150"
                stroke="#F59E0B"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
              <path
                d="M 250 250 L 350 350"
                stroke="#EC4899"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            </svg>

            {/* Built-in Apps */}
            {/* HR Product - Top */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 bg-white rounded-2xl p-4 w-32 shadow-lg border border-blue-200">
              <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">HR</h3>
              <p className="text-xs text-gray-600 text-center">Human Resources</p>
            </div>

            {/* MAIL Product - Right */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-2xl p-4 w-32 shadow-lg border border-green-200">
              <div className="bg-green-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">MAIL</h3>
              <p className="text-xs text-gray-600 text-center">Secure Email</p>
            </div>

            {/* DRIVE Product - Bottom */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 bg-white rounded-2xl p-4 w-32 shadow-lg border border-purple-200">
              <div className="bg-purple-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">DRIVE</h3>
              <p className="text-xs text-gray-600 text-center">Cloud Storage</p>
            </div>

            {/* CONNECT Product - Left */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-2xl p-4 w-32 shadow-lg border border-red-200">
              <div className="bg-red-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">CONNECT</h3>
              <p className="text-xs text-gray-600 text-center">Video Conferencing</p>
            </div>

            {/* Custom App Integration - Top Right */}
            <div className="absolute top-20 right-20 bg-white rounded-2xl p-4 w-32 shadow-lg border border-amber-200">
              <div className="bg-amber-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">Custom Apps</h3>
              <p className="text-xs text-gray-600 text-center">SSO Integration</p>
            </div>

            {/* Website Generation - Bottom Right */}
            <div className="absolute bottom-20 right-20 bg-white rounded-2xl p-4 w-32 shadow-lg border border-pink-200">
              <div className="bg-pink-600 w-10 h-10 rounded-xl flex items-center justify-center mb-3 mx-auto">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1 text-center">Websites</h3>
              <p className="text-xs text-gray-600 text-center">Business Sites</p>
            </div>
          </div>

          {/* Platform Benefits */}
          <div className="mt-12 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-100 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Business Platform</h3>
              <p className="text-gray-600 mb-4">
                Built-in apps, custom integrations, and website generation - all secured with enterprise-grade SSO. 
                Manage your entire business from one unified platform.
              </p>
              <div className="flex justify-center items-center space-x-6 mt-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Enterprise SSO</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Custom Apps</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Websites</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Instant Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apps Section */}
      <section id="apps" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built-in Business Apps</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Four essential applications integrated into one seamless platform, with more coming soon
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* HR Product */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-blue-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">HR Management</h3>
              <p className="text-gray-600 mb-6">
                Complete human resources solution with employee management, payroll, 
                performance tracking, and organizational charts.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Employee onboarding</li>
                <li>• Payroll processing</li>
                <li>• Performance reviews</li>
                <li>• Leave management</li>
              </ul>
            </div>

            {/* MAIL Product */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-green-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Mail</h3>
              <p className="text-gray-600 mb-6">
                Enterprise-grade email solution with advanced security, 
                encryption, and collaboration features.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• End-to-end encryption</li>
                <li>• Advanced spam filtering</li>
                <li>• Calendar integration</li>
                <li>• Team collaboration</li>
              </ul>
            </div>

            {/* DRIVE Product */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-purple-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cloud Drive</h3>
              <p className="text-gray-600 mb-6">
                Secure cloud storage with file sharing, version control, 
                and real-time collaboration capabilities.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• Unlimited storage</li>
                <li>• Real-time sync</li>
                <li>• Version history</li>
                <li>• Team sharing</li>
              </ul>
            </div>

            {/* Connect Product */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="bg-red-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Connect</h3>
              <p className="text-gray-600 mb-6">
                Professional video conferencing platform with HD quality, 
                screen sharing, and meeting recording.
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• HD video calls</li>
                <li>• Screen sharing</li>
                <li>• Meeting recording</li>
                <li>• Virtual backgrounds</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Apps & Website Generation Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Extend Your Business</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Add your own applications and generate professional websites - all secured with our enterprise SSO
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Custom App Integration */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-200">
              <div className="flex items-center mb-6">
                <div className="bg-amber-600 w-16 h-16 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Custom App Integration</h3>
                  <p className="text-amber-600 font-semibold">SSO Validated</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Integrate your existing business applications with CYNAYD One's enterprise SSO. 
                Validate and secure access to any third-party application while maintaining 
                centralized user management and security policies.
              </p>
              <ul className="text-sm text-gray-500 space-y-2 mb-6">
                <li>• Seamless SSO integration for any app</li>
                <li>• Centralized user authentication</li>
                <li>• Role-based access control</li>
                <li>• Security audit and compliance</li>
                <li>• Single dashboard for all applications</li>
              </ul>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Coming Soon:</strong> More built-in apps including CRM, Project Management, 
                  and Business Intelligence tools.
                </p>
              </div>
            </div>

            {/* Website Generation */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-200">
              <div className="flex items-center mb-6">
                <div className="bg-pink-600 w-16 h-16 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Business Website Generation</h3>
                  <p className="text-pink-600 font-semibold">Professional Sites</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Generate professional business websites with our integrated website builder. 
                Create stunning corporate sites, landing pages, and marketing materials 
                that seamlessly integrate with your CYNAYD One ecosystem.
              </p>
              <ul className="text-sm text-gray-500 space-y-2 mb-6">
                <li>• Professional website templates</li>
                <li>• Drag-and-drop website builder</li>
                <li>• Mobile-responsive design</li>
                <li>• SEO optimization tools</li>
                <li>• Integration with business apps</li>
                <li>• Custom domain management</li>
              </ul>
              <div className="bg-pink-50 rounded-lg p-4">
                <p className="text-sm text-pink-800">
                  <strong>Launch Your Business Online:</strong> From concept to live website 
                  in minutes with our intuitive website generation tools.
                </p>
              </div>
            </div>
          </div>

          {/* Integration Benefits */}
          <div className="mt-16 text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-100 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Business Solution</h3>
              <p className="text-gray-600 mb-6">
                CYNAYD One provides everything your business needs: built-in apps, custom integrations, 
                website generation, and enterprise security - all in one unified platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Unified Management</h4>
                  <p className="text-sm text-gray-600">Manage all your business tools from one central dashboard</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Enterprise Security</h4>
                  <p className="text-sm text-gray-600">Bank-level security with SSO, MFA, and audit logging</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Scalable Growth</h4>
                  <p className="text-sm text-gray-600">Grow your business with expandable platform capabilities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Complete Business Management</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to run and grow your business - from HR to websites, all in one secure platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Security</h3>
              <p className="text-gray-600 text-sm">
                Bank-level security with SSO, MFA, role-based access control, 
                and comprehensive audit logging for complete compliance.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Custom Integration</h3>
              <p className="text-gray-600 text-sm">
                Integrate any business application with our SSO platform. 
                Validate and secure access to third-party tools seamlessly.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Website Generation</h3>
              <p className="text-gray-600 text-sm">
                Create professional business websites with our integrated builder. 
                Launch your online presence in minutes with SEO optimization.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-amber-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Unified Platform</h3>
              <p className="text-gray-600 text-sm">
                One dashboard for all your business needs. Manage HR, communication, 
                storage, and custom apps from a single interface.
              </p>
            </div>
          </div>

          {/* Additional Business Benefits */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Scalable Growth</h4>
              <p className="text-gray-600 text-sm">
                Start with our four core apps and expand as your business grows. 
                Add custom applications and generate websites as needed.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Cost Effective</h4>
              <p className="text-gray-600 text-sm">
                One platform replaces multiple tools. Reduce costs while 
                improving efficiency with integrated business management.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Future Ready</h4>
              <p className="text-gray-600 text-sm">
                Built for the future with expandable architecture. 
                New apps and features added regularly to meet evolving needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Transform Your Business with CYNAYD One
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join the complete business ecosystem. Manage HR, communication, storage, custom apps, 
            and generate professional websites - all secured with enterprise-grade SSO.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all shadow-xl"
            >
              Start Free Trial
            </a>
            <a
              href="#ecosystem"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              Explore Platform
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="text-blue-100">
              <div className="text-2xl font-bold text-white mb-1">4+</div>
              <div className="text-sm">Built-in Business Apps</div>
            </div>
            <div className="text-blue-100">
              <div className="text-2xl font-bold text-white mb-1">∞</div>
              <div className="text-sm">Custom App Integrations</div>
            </div>
            <div className="text-blue-100">
              <div className="text-2xl font-bold text-white mb-1">100%</div>
              <div className="text-sm">Enterprise Security</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h3 className="text-xl font-bold">CYNAYD One</h3>
              </div>
              <p className="text-gray-400">
                The complete business platform for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Built-in Apps</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Custom Integration</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Website Generation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise SSO</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CYNAYD One. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </UnifiedLayout>
  );
}
