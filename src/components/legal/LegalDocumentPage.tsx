"use client";

import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { LEGAL_LINKS } from "@/lib/legal/links";
import type { LegalDocument } from "@/lib/legal/types";
import Link from "next/link";
import { useEffect } from "react";

interface LegalDocumentPageProps {
  legalDocument: LegalDocument;
}

export function LegalDocumentPage({ legalDocument }: LegalDocumentPageProps) {
  useEffect(() => {
    document.title = `${legalDocument.title} | CYNAYD One`;
  }, [legalDocument.title]);

  return (
    <UnifiedLayout variant="landing">
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
            <aside className="hidden lg:block">
              <nav className="sticky top-24 space-y-1" aria-label="Legal documents">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 px-2">
                  Legal
                </p>
                {LEGAL_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      link.href === legalDocument.path
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </aside>

            <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10">
              <header className="mb-8 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-500 mb-2">
                  Effective {legalDocument.effectiveDate} · Last updated {legalDocument.lastUpdated}
                </p>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{legalDocument.title}</h1>
                <p className="text-gray-600 leading-relaxed">{legalDocument.description}</p>
              </header>

              <div className="prose prose-gray max-w-none prose-headings:scroll-mt-24">
                {legalDocument.sections.map((section) => (
                  <section key={section.id} id={section.id} className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h2>
                    {section.paragraphs?.map((p, i) => (
                      <p key={i} className="text-gray-600 leading-relaxed mb-3 text-sm md:text-base">
                        {p}
                      </p>
                    ))}
                    {section.list && (
                      <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm md:text-base mb-3">
                        {section.list.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {section.subsections?.map((sub) => (
                      <div key={sub.title} className="ml-0 md:ml-2 mb-4">
                        <h3 className="text-base font-semibold text-gray-800 mb-2">{sub.title}</h3>
                        {sub.paragraphs?.map((p, i) => (
                          <p key={i} className="text-gray-600 leading-relaxed mb-2 text-sm md:text-base">
                            {p}
                          </p>
                        ))}
                        {sub.list && (
                          <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm md:text-base">
                            {sub.list.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              <footer className="mt-10 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4 lg:hidden">Other policies</p>
                <div className="flex flex-wrap gap-3 lg:hidden mb-6">
                  {LEGAL_LINKS.filter((l) => l.href !== legalDocument.path).map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
                <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  ← Back to home
                </Link>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
}
