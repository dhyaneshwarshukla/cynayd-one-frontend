"use client";

import { useEffect, useState } from "react";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Alert } from "@/components/common/Alert";
import { apiClient } from "@/lib/api-client";

type ContactTopic = "general" | "sales" | "support" | "partnership";

const TOPIC_OPTIONS: { value: ContactTopic; label: string }[] = [
  { value: "general", label: "General inquiry" },
  { value: "sales", label: "Sales & pricing" },
  { value: "support", label: "Technical support" },
  { value: "partnership", label: "Partnership" },
];

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function ContactCard({
  icon,
  title,
  description,
  actionLabel,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <Card className="p-6 flex flex-col">
      <span className="text-3xl mb-3" aria-hidden>
        {icon}
      </span>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 flex-1">{description}</p>
      <a href={href} className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all">
        {actionLabel}
      </a>
    </Card>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    document.title = "Contact Us | CYNAYD One";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const result = await apiClient.submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        topic,
        message: message.trim(),
      });

      setFeedback({ type: "success", text: result.message });
      setName("");
      setEmail("");
      setCompany("");
      setTopic("general");
      setMessage("");
    } catch (err) {
      const text =
        err instanceof Error ? err.message : "Something went wrong. Please try again or email us directly.";
      setFeedback({ type: "error", text });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UnifiedLayout variant="landing">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Contact CYNAYD One</h1>
          <p className="text-lg text-gray-600">
            Questions about our platform, pricing, or partnerships? We&apos;re here to help — whether
            you&apos;re evaluating CYNAYD or already planning your rollout.
          </p>
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <ContactCard
            icon="📧"
            title="Email us"
            description="Reach our team directly. We typically respond within one business day."
            actionLabel="support@cynayd.com"
            href="mailto:support@cynayd.com"
          />
          <ContactCard
            icon="💼"
            title="Sales"
            description="Questions about plans, enterprise SSO, or custom deployments."
            actionLabel="sales@cynayd.com"
            href="mailto:sales@cynayd.com"
          />
          <ContactCard
            icon="🔐"
            title="Existing customers"
            description="Already have an account? Use in-app help for faster support tied to your org."
            actionLabel="Go to Help"
            href="/dashboard/help"
          />
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Support hours</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Monday – Friday</dt>
                  <dd className="font-medium text-gray-900">9:00 AM – 6:00 PM IST</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Saturday</dt>
                  <dd className="font-medium text-gray-900">10:00 AM – 4:00 PM IST</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-600">Sunday</dt>
                  <dd className="font-medium text-gray-900">Closed</dd>
                </div>
              </dl>
            </Card>
            <Card className="p-6 bg-blue-50 border-blue-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Not a customer yet?</h2>
              <p className="text-sm text-gray-600 mb-4">
                Explore plans and start your organization workspace in minutes.
              </p>
              <a
                href="/auth/register"
                className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Create free account →
              </a>
            </Card>
          </div>

          <Card className="lg:col-span-3 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Send us a message</h2>
            <p className="text-sm text-gray-600 mb-6">
              No login required — for visitors and prospects exploring CYNAYD One.
            </p>

            {feedback && (
              <div className="mb-6">
                <Alert variant={feedback.type === "success" ? "success" : "error"}>{feedback.text}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="contact-company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    id="contact-company"
                    type="text"
                    maxLength={200}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={inputClass}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-topic" className="block text-sm font-medium text-gray-700 mb-1">
                  Topic <span className="text-red-500">*</span>
                </label>
                <select
                  id="contact-topic"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as ContactTopic)}
                  className={inputClass}
                >
                  {TOPIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={inputClass}
                  placeholder="Tell us how we can help..."
                />
              </div>

              <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full sm:w-auto">
                Send message
              </Button>
            </form>
          </Card>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400 text-sm">
          <p>
            <a href="/" className="hover:text-white transition-colors">
              ← Back to home
            </a>
            {" · "}
            <a href="/auth/login" className="hover:text-white transition-colors">
              Sign in
            </a>
          </p>
          <p className="mt-4">&copy; {new Date().getFullYear()} CYNAYD One. All rights reserved.</p>
        </div>
      </footer>
    </UnifiedLayout>
  );
}
