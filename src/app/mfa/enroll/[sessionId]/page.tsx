'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function MfaEnrollFallbackPage() {
  const params = useParams();
  const sessionId = typeof params.sessionId === 'string' ? params.sessionId : '';

  useEffect(() => {
    if (!sessionId) return;
    const deepLink = `cynaydone://mfa-enroll?sessionId=${encodeURIComponent(sessionId)}`;
    window.location.href = deepLink;
  }, [sessionId]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-3">Open in Cynayd app</h1>
        <p className="text-sm text-gray-600 mb-6">
          Complete MFA setup in the Cynayd One Auth app. If the app did not open automatically, open it
          manually and go to Security → Pending MFA Setup.
        </p>
        <a
          href={`cynaydone://mfa-enroll?sessionId=${encodeURIComponent(sessionId)}`}
          className="inline-block bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium py-2 px-4 rounded"
        >
          Open Cynayd app
        </a>
      </div>
    </main>
  );
}
