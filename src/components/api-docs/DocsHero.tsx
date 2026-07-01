'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/common/Button';
import { DOCS_LAST_UPDATED, PARTNER_API_BASE_URL } from '@/lib/api-docs/constants';
import { QUICK_START_CARDS, type GuideSectionId } from '@/lib/api-docs/docs-sections';

interface DocsHeroProps {
  onQuickStartClick: (sectionId: GuideSectionId) => void;
}

export function DocsHero({ onQuickStartClick }: DocsHeroProps) {
  const [copied, setCopied] = useState(false);

  const copyBaseUrl = async () => {
    try {
      await navigator.clipboard.writeText(PARTNER_API_BASE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
            CYNAYD One Partner API Documentation
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            Integrate third-party apps with CYNAYD One using SSO, SAML, service credentials,
            app assignment, provisioning, and webhooks.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span>Last updated: {DOCS_LAST_UPDATED}</span>
          <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-700">
            Contact support
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm text-gray-500">Base URL (production)</div>
            <div className="mt-1 font-mono text-sm text-gray-900">{PARTNER_API_BASE_URL}</div>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copyBaseUrl}>
            {copied ? 'Copied!' : 'Copy base URL'}
          </Button>
        </div>

        <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          API Reference is read-only in production. Copy curl examples from each endpoint —
          interactive try-it-out is disabled until sandbox credentials are available.
        </p>
      </div>
    </section>
  );
}
