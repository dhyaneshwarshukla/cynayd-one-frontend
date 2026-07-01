'use client';

import { useState } from 'react';
import { Button } from '@/components/common/Button';

interface DocsCodeBlockProps {
  children: string;
  language?: string;
}

export function DocsCodeBlock({ children, language }: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative mt-4 rounded-xl bg-gray-950 text-sm text-gray-100">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        {language ? (
          <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{language}</span>
        ) : (
          <span />
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 text-xs text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-4 font-mono text-[13px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}
