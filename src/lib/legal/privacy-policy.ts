import { COMPANY_NAME, PRIVACY_EMAIL, PRODUCT_NAME } from "./links";
import type { LegalDocument } from "./types";

export const privacyPolicy: LegalDocument = {
  title: "Privacy Policy",
  path: "/privacy",
  effectiveDate: "May 21, 2026",
  lastUpdated: "May 21, 2026",
  description: `This Privacy Policy explains how ${COMPANY_NAME} ("we", "us", or "our") collects, uses, discloses, and protects personal information when you use ${PRODUCT_NAME}, our AI workspace and business productivity platform, including cloud-hosted and self-hosted deployments.`,
  sections: [
    {
      id: "scope",
      title: "1. Scope",
      paragraphs: [
        `This policy applies to visitors of our websites, account holders, organization administrators, and end users of ${PRODUCT_NAME} services (collectively, "you"). It covers data processed through our platform apps including Mail, Drive, Calendar, Connect, Tasks, Meetings, Forms, Vault, and related enterprise features.`,
        "If you access CYNAYD One through your employer or another organization, that organization may act as the controller of certain data. We process such data on their instructions as described in our Data Processing Agreement.",
      ],
    },
    {
      id: "information",
      title: "2. Information we collect",
      subsections: [
        {
          title: "Account and profile data",
          list: [
            "Name, email address, job title, and organization details provided at registration",
            "Authentication credentials (passwords stored using industry-standard hashing)",
            "SSO and identity provider attributes when you sign in via SAML or similar methods",
          ],
        },
        {
          title: "Workspace and usage data",
          list: [
            "Content you create or upload (emails, files, calendar events, messages, tasks, form responses, vault entries)",
            "Metadata such as timestamps, IP addresses, device information, and audit logs",
            "AI-assisted features may process content to provide summaries, suggestions, or automation — only as configured by your organization",
          ],
        },
        {
          title: "Payment and billing",
          paragraphs: [
            "Paid subscriptions may be processed by third-party payment providers. We receive billing status and limited payment identifiers, not full card numbers stored on our core platform unless required for your plan.",
          ],
        },
      ],
    },
    {
      id: "use",
      title: "3. How we use information",
      list: [
        "Provide, operate, and improve the CYNAYD One platform",
        "Authenticate users and enforce security, access controls, and fraud prevention",
        "Deliver customer support and respond to inquiries",
        "Send service-related communications (e.g., verification, security alerts, billing)",
        "Comply with legal obligations and enforce our Terms and Acceptable Use Policy",
        "Generate aggregated, de-identified analytics to improve reliability and features",
      ],
    },
    {
      id: "legal-bases",
      title: "4. Legal bases (where applicable)",
      paragraphs: [
        "For users in jurisdictions requiring a legal basis (such as the EEA/UK), we rely on: performance of a contract; legitimate interests (security, product improvement, fraud prevention); consent where required (e.g., non-essential cookies); and legal obligation where applicable.",
      ],
    },
    {
      id: "sharing",
      title: "5. Sharing and disclosure",
      paragraphs: [
        "We do not sell your personal information. We may share data with:",
      ],
      list: [
        "Service providers (hosting, email delivery, analytics, payment processing) under contractual confidentiality and security obligations",
        "Your organization administrators when you use an enterprise or team account",
        "Authorities when required by law or to protect rights, safety, and security",
        "Successors in connection with a merger, acquisition, or asset sale, subject to this policy",
      ],
    },
    {
      id: "retention",
      title: "6. Data retention",
      paragraphs: [
        "We retain personal information for as long as your account is active or as needed to provide services, comply with law, resolve disputes, and enforce agreements. Organization administrators may configure retention for certain workspace data. Upon account deletion, we delete or anonymize data within a reasonable period, subject to backup and legal retention requirements.",
      ],
    },
    {
      id: "security",
      title: "7. Security",
      paragraphs: [
        "We implement technical and organizational measures including encryption in transit, access controls, SSO support, audit logging, and secure development practices. Self-hosted customers are responsible for securing their own infrastructure while we provide deployment guidance.",
        "No method of transmission or storage is 100% secure. Report suspected incidents to " + PRIVACY_EMAIL + ".",
      ],
    },
    {
      id: "rights",
      title: "8. Your rights",
      paragraphs: [
        "Depending on your location, you may have rights to access, correct, delete, restrict processing, object, data portability, and withdraw consent. Organization users should contact their administrator first; administrators may submit requests on behalf of users.",
        `Contact ${PRIVACY_EMAIL} to exercise rights. We will respond within applicable legal timeframes.`,
      ],
    },
    {
      id: "international",
      title: "9. International transfers",
      paragraphs: [
        "Your data may be processed in countries other than your own. Where required, we use appropriate safeguards such as standard contractual clauses or equivalent mechanisms.",
      ],
    },
    {
      id: "children",
      title: "10. Children",
      paragraphs: [
        "CYNAYD One is not directed to children under 16. We do not knowingly collect personal information from children. Contact us if you believe we have collected such data.",
      ],
    },
    {
      id: "changes",
      title: "11. Changes",
      paragraphs: [
        "We may update this policy. Material changes will be notified via the service or email where appropriate. Continued use after the effective date constitutes acceptance of the updated policy.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact",
      paragraphs: [
        `${COMPANY_NAME} — Privacy inquiries: ${PRIVACY_EMAIL}`,
        "For enterprise data processing terms, see our Data Processing Agreement.",
      ],
    },
  ],
};
