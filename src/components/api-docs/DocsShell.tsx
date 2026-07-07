'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiReference } from '@/components/api-docs/ApiReference';
import { DocsHero } from '@/components/api-docs/DocsHero';
import { DocsTabs } from '@/components/api-docs/DocsTabs';
import { DocsTableOfContents } from '@/components/api-docs/DocsTableOfContents';
import { IntegrationGuide } from '@/components/api-docs/IntegrationGuide';
import type { DocsTab } from '@/lib/api-docs/constants';
import type { GuideSectionId } from '@/lib/api-docs/docs-sections';

function parseTab(value: string | null): DocsTab {
  return value === 'reference' ? 'reference' : 'guide';
}

export function DocsShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DocsTab>(() => parseTab(searchParams.get('tab')));

  useEffect(() => {
    document.title = 'Cynayd One Developer API | CYNAYD One';
  }, []);

  useEffect(() => {
    setActiveTab(parseTab(searchParams.get('tab')));
  }, [searchParams]);

  const setTab = useCallback(
    (tab: DocsTab) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      if (tab === 'guide') {
        params.delete('tab');
      } else {
        params.set('tab', tab);
      }
      const query = params.toString();
      router.replace(query ? `/api-docs?${query}` : '/api-docs', { scroll: false });
    },
    [router, searchParams],
  );

  const handleQuickStartClick = useCallback(
    (sectionId: GuideSectionId) => {
      setTab('guide');
      window.setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    },
    [setTab],
  );

  const isGuide = activeTab === 'guide';

  return (
    <main className="min-h-screen bg-gray-50">
      <DocsHero onQuickStartClick={handleQuickStartClick} />

      <section
        className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${isGuide ? 'py-8' : 'py-6'}`}
      >
        <div className="mb-8">
          <DocsTabs activeTab={activeTab} onTabChange={setTab} />
        </div>

        {isGuide ? (
          <div
            role="tabpanel"
            id="panel-guide"
            aria-labelledby="tab-guide"
            className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-10"
          >
            <DocsTableOfContents variant="sidebar" />
            <div>
              <DocsTableOfContents variant="mobile" />
              <IntegrationGuide />
            </div>
          </div>
        ) : (
          <div role="tabpanel" id="panel-reference" aria-labelledby="tab-reference">
            <ApiReference />
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-600">
            Need API access?{' '}
            <Link href="/contact" className="font-medium text-blue-600 hover:text-blue-700">
              Contact CYNAYD support
            </Link>{' '}
            to enable production credentials.
          </p>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            ← Back to home
          </Link>
        </div>
      </footer>
    </main>
  );
}
