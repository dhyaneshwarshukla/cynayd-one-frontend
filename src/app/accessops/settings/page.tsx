import Link from 'next/link';

const settings = [
  ['connections', 'Connections', 'Connect Microsoft or Google Workspace and monitor health.'],
  ['approval-rules', 'Approval rules', 'Understand how access requests are routed for approval.'],
  ['access-review', 'Access review', 'Create and monitor periodic access review campaigns.'],
  ['advanced', 'Advanced', 'Evidence, reconciliation, dead letters, and diagnostics.'],
];

export default function AccessOpsSettingsPage() {
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-semibold text-gray-900">Settings</h1><p className="mt-1 text-sm text-gray-600">Configure AccessOps connections and governance.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {settings.map(([slug, title, detail]) => (
          <Link key={slug} href={`/accessops/settings/${slug}`} className="rounded-lg border bg-white p-5 shadow-sm hover:border-indigo-300">
            <h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-gray-600">{detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
