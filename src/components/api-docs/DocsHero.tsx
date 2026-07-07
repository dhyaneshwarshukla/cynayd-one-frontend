'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import {
  AUTH_API_BASE_URL,
  DOCS_LAST_UPDATED,
  PLATFORM_API_BASE_URL,
} from '@/lib/api-docs/constants';
import { QUICK_START_CARDS, type GuideSectionId } from '@/lib/api-docs/docs-sections';

interface DocsHeroProps {
  onQuickStartClick: (sectionId: GuideSectionId) => void;
}

export function DocsHero({ onQuickStartClick }: DocsHeroProps) {
  const [copiedAuth, setCopiedAuth] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState(false);

  const copyUrl = async (url: string, setter: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(url);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      setter(false);
    }
  };

  return (
    <section className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Developer Platform
        </p>

        <div className="mt-4 max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Cynayd One Developer API
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            Build integrations with a unified platform API for Calendar, Tasks, Docs, Forms,
            Mail, and Drive. Authenticate via auth.one.cynayd.com; call product APIs at
            api.one.cynayd.com.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>Last updated: {DOCS_LAST_UPDATED}</span>
          <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-700">
            Contact support
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_START_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => onQuickStartClick(card.id)}
              className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-left transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm"
            >
              <span className="text-2xl" aria-hidden>
                {card.icon}
              </span>
              <h2 className="mt-3 font-semibold text-gray-900">{card.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{card.description}</p>
              <span className="mt-3 inline-block text-sm font-medium text-blue-600">
                View guide →
              </span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Auth API (production)</div>
              <div className="mt-1 font-mono text-sm text-gray-900">{AUTH_API_BASE_URL}</div>
              <p className="mt-2 text-xs text-gray-500">SSO, tokens, SAML, service credentials</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyUrl(AUTH_API_BASE_URL, setCopiedAuth)}
            >
              {copiedAuth ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Platform API (production)</div>
              <div className="mt-1 font-mono text-sm text-gray-900">{PLATFORM_API_BASE_URL}</div>
              <p className="mt-2 text-xs text-gray-500">Calendar, Mail, Docs, Forms, Drive</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => copyUrl(PLATFORM_API_BASE_URL, setCopiedPlatform)}
            >
              {copiedPlatform ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Public integration APIs are documented in the API Reference. Internal admin, billing,
          and security APIs are not published here.
        </p>
      </div>
    </section>
  );
}
