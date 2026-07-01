import { LEGAL_EMAIL, PRODUCT_NAME } from "./links";
import type { LegalDocument } from "./types";

export const acceptableUsePolicy: LegalDocument = {
  title: "Acceptable Use Policy",
  path: "/acceptable-use",
  effectiveDate: "May 21, 2026",
  lastUpdated: "May 21, 2026",
  description: `This Acceptable Use Policy ("AUP") describes prohibited and restricted uses of ${PRODUCT_NAME}. It supplements our Terms of Service. Violations may result in suspension or termination without refund.`,
  sections: [
    {
      id: "purpose",
      title: "1. Purpose",
      paragraphs: [
        "CYNAYD One is intended for lawful business communication, collaboration, and productivity. You must use the platform responsibly and in compliance with applicable laws.",
      ],
    },
    {
      id: "prohibited",
      title: "2. Prohibited activities",
      list: [
        "Illegal activity, fraud, harassment, threats, hate speech, or exploitation of minors",
        "Sending spam, phishing, malware, or unauthorized bulk communications via Mail or Connect",
        "Attempting unauthorized access, probing, scraping, or circumventing security controls",
        "Interfering with service integrity (DDoS, resource abuse, crypto mining on shared infrastructure)",
        "Storing or distributing content that infringes intellectual property or privacy rights",
        "Using AI features to generate unlawful, deceptive, or harmful content at scale",
        "Misrepresenting identity or impersonating others without authorization",
        "Reselling or sublicensing the service except as expressly permitted in your agreement",
      ],
    },
    {
      id: "content",
      title: "3. Content standards",
      paragraphs: [
        "Organization administrators are responsible for user conduct within their tenant. We may remove or restrict content that violates this AUP or applicable law, with notice where practicable.",
      ],
      list: [
        "Do not upload highly sensitive personal data unless your organization has approved use cases and safeguards",
        "Respect export control and sanctions laws when sharing data internationally",
        "Comply with email and messaging regulations (CAN-SPAM, GDPR marketing rules, etc.) where applicable",
      ],
    },
    {
      id: "security",
      title: "4. Security requirements",
      list: [
        "Use strong passwords and enable MFA where available",
        "Do not share credentials or API tokens; rotate compromised secrets promptly",
        "Report vulnerabilities responsibly to " + LEGAL_EMAIL,
        "Self-hosted deployments must apply security patches and network controls to their environment",
      ],
    },
    {
      id: "automation",
      title: "5. Automation and APIs",
      paragraphs: [
        "APIs, webhooks, and workflow automation must not exceed reasonable rate limits or degrade service for others. Automated access requires valid authentication and compliance with documentation.",
      ],
    },
    {
      id: "enforcement",
      title: "6. Enforcement",
      paragraphs: [
        "We may investigate suspected violations using logs and metadata. Remedies include warnings, feature restrictions, account suspension, termination, and cooperation with law enforcement where required.",
        "Appeals may be submitted to " + LEGAL_EMAIL + " with relevant account details.",
      ],
    },
    {
      id: "changes",
      title: "7. Changes",
      paragraphs: [
        "We may update this AUP. Continued use after notice constitutes acceptance. Material changes affecting enterprise customers may be communicated separately.",
      ],
    },
  ],
};
