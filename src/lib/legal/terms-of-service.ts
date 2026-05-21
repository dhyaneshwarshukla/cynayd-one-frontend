import { COMPANY_NAME, LEGAL_EMAIL, PRODUCT_NAME } from "./links";
import type { LegalDocument } from "./types";

export const termsOfService: LegalDocument = {
  title: "Terms of Service",
  path: "/terms",
  effectiveDate: "May 21, 2026",
  lastUpdated: "May 21, 2026",
  description: `These Terms of Service ("Terms") govern access to and use of ${PRODUCT_NAME} and related services provided by ${COMPANY_NAME}. By creating an account or using the service, you agree to these Terms.`,
  sections: [
    {
      id: "agreement",
      title: "1. Agreement",
      paragraphs: [
        "If you use CYNAYD One on behalf of an organization, you represent that you have authority to bind that organization. In that case, \"you\" refers to the organization.",
        "Supplemental terms (e.g., enterprise orders, self-hosting agreements) may apply and prevail where expressly agreed in writing.",
      ],
    },
    {
      id: "service",
      title: "2. The service",
      paragraphs: [
        `${PRODUCT_NAME} is an AI workspace and business productivity platform including mail, drive, calendar, collaboration, tasks, meetings, forms, vault, workflow automation (where available), and enterprise administration features.`,
        "We may modify, suspend, or discontinue features with reasonable notice where practicable. Beta or preview features are provided \"as is\" without SLA guarantees unless otherwise stated.",
      ],
    },
    {
      id: "accounts",
      title: "3. Accounts and eligibility",
      list: [
        "You must provide accurate registration information and keep credentials confidential",
        "You are responsible for activity under your account and must notify us of unauthorized access",
        "We may suspend or terminate accounts that violate these Terms or our Acceptable Use Policy",
        "Minimum age: you must be at least 16 years old, or the age required in your jurisdiction",
      ],
    },
    {
      id: "subscriptions",
      title: "4. Subscriptions and payment",
      paragraphs: [
        "Paid plans are billed according to the pricing selected at purchase. Fees are non-refundable except where required by law or expressly stated in your order.",
        "You authorize us and our payment processors to charge applicable fees. Failure to pay may result in suspension of access.",
        "Free trials convert to paid plans unless cancelled before the trial ends, as disclosed at signup.",
      ],
    },
    {
      id: "content",
      title: "5. Your content",
      paragraphs: [
        "You retain ownership of content you submit. You grant us a limited license to host, process, transmit, and display content solely to operate and improve the service, including AI-assisted features enabled by your organization.",
        "You are responsible for ensuring you have rights to upload and share content and that it complies with applicable law and our Acceptable Use Policy.",
      ],
    },
    {
      id: "acceptable-use",
      title: "6. Acceptable use",
      paragraphs: [
        "Use of the service is subject to our Acceptable Use Policy, incorporated by reference. Violations may result in immediate suspension or termination.",
      ],
    },
    {
      id: "ip",
      title: "7. Intellectual property",
      paragraphs: [
        "We and our licensors own the platform, software, branding, and documentation. Except for rights expressly granted, no license is implied. You may not reverse engineer, copy, or resell the service except as permitted for self-hosted deployments under a separate license.",
      ],
    },
    {
      id: "confidentiality",
      title: "8. Confidentiality and security",
      paragraphs: [
        "Each party will protect the other's confidential information using reasonable care. Our security practices are described in documentation and the Privacy Policy. Self-hosted customers are responsible for their deployment environment.",
      ],
    },
    {
      id: "warranty",
      title: "9. Disclaimers",
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" TO THE MAXIMUM EXTENT PERMITTED BY LAW. WE DISCLAIM WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION.',
      ],
    },
    {
      id: "liability",
      title: "10. Limitation of liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOST PROFITS OR DATA.",
        "OUR AGGREGATE LIABILITY FOR CLAIMS ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNTS PAID BY YOU TO US IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR ONE HUNDRED U.S. DOLLARS (USD $100) IF NO FEES WERE PAID, WHICHEVER IS GREATER.",
      ],
    },
    {
      id: "indemnity",
      title: "11. Indemnification",
      paragraphs: [
        "You will indemnify and hold us harmless from claims arising from your content, misuse of the service, or violation of these Terms, except to the extent caused by our gross negligence or willful misconduct.",
      ],
    },
    {
      id: "termination",
      title: "12. Termination",
      paragraphs: [
        "Either party may terminate for material breach not cured within thirty (30) days of notice. We may suspend access immediately for security risks or AUP violations.",
        "Upon termination, your right to access ends. Export provisions may be available before deletion as described in product documentation.",
      ],
    },
    {
      id: "governing",
      title: "13. Governing law and disputes",
      paragraphs: [
        "These Terms are governed by the laws of India, without regard to conflict-of-law principles, unless mandatory local consumer laws apply.",
        "Disputes shall be resolved through good-faith negotiation, then courts of competent jurisdiction in India unless otherwise agreed in an enterprise contract.",
      ],
    },
    {
      id: "contact",
      title: "14. Contact",
      paragraphs: [`Questions about these Terms: ${LEGAL_EMAIL}`],
    },
  ],
};
