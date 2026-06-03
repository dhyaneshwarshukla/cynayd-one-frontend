"use client";

import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import PricingSection from "@/components/common/PricingSection";
import {
  AI_FEATURES,
  BENEFIT_CARDS,
  DEVELOPER_FEATURES,
  ENTERPRISE_FEATURES,
  LANDING_SEO,
  SELF_HOST_FEATURES,
  WORKSPACE_APPS,
} from "@/lib/landing-content";
import { useEffect } from "react";

function CheckIcon({ className = "w-4 h-4 text-blue-600 mr-2" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const benefitIconColors: Record<string, string> = {
  blue: "from-blue-600 to-indigo-600",
  indigo: "from-indigo-600 to-violet-600",
  green: "from-emerald-600 to-green-600",
  purple: "from-purple-600 to-fuchsia-600",
};

export default function HomePage() {
  useEffect(() => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "CYNAYD One",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      description: LANDING_SEO.description,
      featureList: LANDING_SEO.featureList,
      screenshot: `${siteUrl}/og-image.jpg`,
    };

    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "CYNAYD",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Customer Service",
        email: "support@cynayd.com",
      },
    };

    const websiteData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "CYNAYD One",
      url: siteUrl,
    };

    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach((script) => script.remove());

    const addStructuredData = (data: object, id: string) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
    };

    addStructuredData(structuredData, "software-application-schema");
    addStructuredData(organizationData, "organization-schema");
    addStructuredData(websiteData, "website-schema");

    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach((script) => {
        if (["software-application-schema", "organization-schema", "website-schema"].includes(script.id)) {
          script.remove();
        }
      });
    };
  }, []);

  return (
    <UnifiedLayout variant="landing">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <p className="text-sm font-semibold tracking-wide text-indigo-600 uppercase mb-4">
              AI Workspace + Business Productivity Platform
            </p>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                The AI-powered workspace
              </span>
              <br />
              for modern teams
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              CYNAYD One combines mail, drive, calendar, meetings, tasks and collaboration tools into one
              secure AI-powered workspace. Built for modern collaborative workflows with integrated AI.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center mb-8">
              <a
                href="/auth/register"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
              >
                Start Free
              </a>
              <a
                href="/contact"
                className="bg-white text-gray-800 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-50 transition-all shadow border border-gray-200"
              >
                Book Demo
              </a>
              <a
                href="#self-hosting"
                className="bg-white text-gray-800 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-50 transition-all shadow border border-gray-200"
              >
                Self Host
              </a>
              <a
                href="/contact"
                className="bg-white text-blue-700 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-50 transition-all shadow border border-blue-200"
              >
                Contact Sales
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-emerald-600" />
                Unified apps
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-emerald-600" />
                AI inside workflows
              </span>
              <span className="flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-emerald-600" />
                Enterprise SSO
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              One workspace for communication, collaboration &amp; execution
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Replace disconnected tools with a modern platform designed for teams that move fast.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFIT_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefitIconColors[card.color]} flex items-center justify-center mb-4`}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apps */}
      <section id="apps" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">CYNAYD One apps</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Mail-centric productivity with integrated automation across every active app in your workspace.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WORKSPACE_APPS.map((app) => (
              <div
                key={app.name}
                className={`bg-gradient-to-br ${app.gradient} rounded-2xl p-6 border border-white/80 hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`${app.iconColor} w-12 h-12 rounded-xl flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{app.name.charAt(0)}</span>
                  </div>
                  {app.badge && (
                    <span className="text-xs font-semibold uppercase tracking-wide bg-indigo-600 text-white px-2.5 py-1 rounded-full">
                      {app.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">{app.productName}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{app.name}</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{app.description}</p>
                <ul className="text-sm text-gray-500 space-y-1.5">
                  {app.features.map((f) => (
                    <li key={f} className="flex items-start">
                      <CheckIcon className="w-4 h-4 text-gray-500 mr-2 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-10">
            Plus Admin Console and SSO for organization-wide control and secure access.
          </p>
        </div>
      </section>

      {/* AI */}
      <section id="ai" className="py-20 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-indigo-300 text-sm font-semibold uppercase tracking-wide mb-3">AI differentiation</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">AI that works inside your workflow</h2>
              <p className="text-blue-100 text-lg leading-relaxed mb-6">
                Not a generic chatbot — contextual intelligence across mail, calendar, tasks and automation so
                your team stays in flow.
              </p>
              <a
                href="/auth/register"
                className="inline-block bg-white text-indigo-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                See it in action
              </a>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AI_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15"
                >
                  <CheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm text-blue-50">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Enterprise */}
      <section id="enterprise" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Enterprise-ready</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Security, governance and deployment options built for organizations that need control at scale.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ENTERPRISE_FEATURES.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 p-6 hover:border-blue-100 hover:shadow-sm transition-all">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Self hosting */}
      <section id="self-hosting" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Self hosting</h2>
            <p className="text-lg text-gray-600">
              Deploy CYNAYD One on your own infrastructure with complete control over your data and security.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
            {SELF_HOST_FEATURES.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-700 shadow-sm"
              >
                <CheckIcon className="w-4 h-4 text-blue-600 mr-0" />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Developers */}
      <section id="developers" className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Developers &amp; APIs</h2>
              <p className="text-lg text-gray-600 mb-6">
                Build integrations and automate workflows with developer-friendly APIs.
              </p>
              <a
                href="/api-docs"
                className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
              >
                View API documentation →
              </a>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEVELOPER_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <PricingSection />

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Replace disconnected tools with one unified workspace
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Mail-centric productivity, cross-app orchestration and AI inside every workflow — on cloud or
            your own infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-gray-100 transition-all shadow-lg"
            >
              Get Started
            </a>
            <a
              href="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-white hover:text-blue-600 transition-all"
            >
              Book Demo
            </a>
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
              <p className="text-gray-400 text-sm">
                AI workspace and business productivity platform for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/#apps" className="hover:text-white transition-colors">Apps</a></li>
                <li><a href="/#ai" className="hover:text-white transition-colors">AI</a></li>
                <li><a href="/#enterprise" className="hover:text-white transition-colors">Enterprise</a></li>
                <li><a href="/#self-hosting" className="hover:text-white transition-colors">Self hosting</a></li>
                <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/api-docs" className="hover:text-white transition-colors">Docs</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="/auth/login" className="hover:text-white transition-colors">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</a></li>
                <li><a href="/dpa" className="hover:text-white transition-colors">DPA</a></li>
                <li><a href="/cookies" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} CYNAYD One. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </UnifiedLayout>
  );
}
