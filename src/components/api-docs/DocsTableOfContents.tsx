'use client';

import { useEffect, useState } from 'react';
import { GUIDE_SECTIONS, type GuideSectionId } from '@/lib/api-docs/docs-sections';

interface DocsTableOfContentsProps {
  variant?: 'sidebar' | 'mobile';
}

export function DocsTableOfContents({ variant = 'sidebar' }: DocsTableOfContentsProps) {
  const [activeId, setActiveId] = useState<GuideSectionId>(GUIDE_SECTIONS[0].id);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const sectionElements = GUIDE_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0 && visible[0].target.id) {
          setActiveId(visible[0].target.id as GuideSectionId);
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleClick = (id: GuideSectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
    setMobileOpen(false);
  };

  const linkClass = (id: GuideSectionId) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      activeId === id
        ? 'bg-blue-50 text-blue-700'
        : 'text-gray-600 hover:bg-white hover:text-gray-900'
    }`;

  if (variant === 'mobile') {
    return (
      <div className="mb-6 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-sm"
          aria-expanded={mobileOpen}
        >
          <span>On this page</span>
          <span className="text-gray-400" aria-hidden>
            {mobileOpen ? '▲' : '▼'}
          </span>
        </button>
        {mobileOpen && (
          <nav
            className="mt-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
            aria-label="On this page"
          >
            {GUIDE_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleClick(section.id)}
                className={`w-full text-left ${linkClass(section.id)}`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        )}
      </div>
    );
  }

  return (
    <aside className="hidden lg:block">
      <nav className="sticky top-24 space-y-1" aria-label="Integration guide sections">
        <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          On this page
        </p>
        {GUIDE_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => handleClick(section.id)}
            className={`w-full text-left ${linkClass(section.id)}`}
          >
            {section.title}
          </button>
        ))}
      </nav>
    </aside>
  );
}
