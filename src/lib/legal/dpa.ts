import { COMPANY_NAME, LEGAL_EMAIL, PRIVACY_EMAIL, PRODUCT_NAME } from "./links";
import type { LegalDocument } from "./types";

export const dataProcessingAgreement: LegalDocument = {
  title: "Data Processing Agreement",
  path: "/dpa",
  effectiveDate: "May 21, 2026",
  lastUpdated: "May 21, 2026",
  description: `This Data Processing Agreement ("DPA") applies when ${COMPANY_NAME} processes personal data on behalf of a customer ("Controller") in connection with ${PRODUCT_NAME}. It forms part of the Terms of Service for enterprise and organization accounts unless a custom DPA is executed.`,
  sections: [
    {
      id: "definitions",
      title: "1. Definitions",
      list: [
        '"Personal Data" means information relating to an identified or identifiable individual processed under this DPA',
        '"Processing" means any operation performed on Personal Data as defined under applicable data protection law',
        '"Sub-processor" means a third party engaged by us to process Personal Data',
        '"Applicable Law" includes GDPR, UK GDPR, and other laws binding the Controller',
      ],
    },
    {
      id: "roles",
      title: "2. Roles of the parties",
      paragraphs: [
        "The Controller determines purposes and means of processing Personal Data of its users, employees, and contacts. CYNAYD acts as Processor (or Sub-processor where applicable) when handling such data to provide the service.",
        "Where CYNAYD processes account data for billing, security, or account management, CYNAYD may act as an independent Controller as described in the Privacy Policy.",
      ],
    },
    {
      id: "scope",
      title: "3. Scope and instructions",
      paragraphs: [
        "We process Personal Data only on documented instructions from the Controller, including configuration of the platform, integrations, and support requests — unless required by law.",
        "Controller is responsible for the lawfulness of instructions and for providing required notices and obtaining consents from data subjects.",
      ],
    },
    {
      id: "security",
      title: "4. Security measures",
      paragraphs: [
        "We implement appropriate technical and organizational measures including access controls, encryption in transit, logging, incident response, and personnel confidentiality obligations. Details are available upon request and in security documentation.",
        "Self-hosted deployments: Controller is responsible for infrastructure security; we provide software updates and guidance as per the deployment agreement.",
      ],
    },
    {
      id: "subprocessors",
      title: "5. Sub-processors",
      paragraphs: [
        "Controller authorizes use of Sub-processors for hosting, communications, analytics, and support. A current list is available on request. We impose data protection terms on Sub-processors comparable to this DPA.",
        "We will notify Controllers of new Sub-processors where required by law, allowing objection for legitimate grounds.",
      ],
    },
    {
      id: "rights",
      title: "6. Data subject rights",
      paragraphs: [
        "We assist Controller in responding to data subject requests (access, deletion, etc.) using available platform tools and support channels, within reasonable timeframes.",
      ],
    },
    {
      id: "breach",
      title: "7. Personal data breaches",
      paragraphs: [
        "We will notify Controller without undue delay after becoming aware of a Personal Data breach affecting Controller data, providing information reasonably available to support Controller's regulatory obligations.",
      ],
    },
    {
      id: "deletion",
      title: "8. Return and deletion",
      paragraphs: [
        "Upon termination, Controller may export data using platform features. We will delete or anonymize Personal Data within agreed retention periods, except where retention is required by law or backup cycles (typically up to 90 days).",
      ],
    },
    {
      id: "audit",
      title: "9. Audits",
      paragraphs: [
        "Upon reasonable request, we provide information necessary to demonstrate compliance, including summaries of certifications or audit reports where available. Onsite audits may be conducted no more than annually with thirty (30) days' notice, subject to confidentiality and minimal disruption.",
      ],
    },
    {
      id: "transfers",
      title: "10. International transfers",
      paragraphs: [
        "Where Personal Data is transferred outside the EEA/UK, we rely on appropriate safeguards such as Standard Contractual Clauses (SCCs) or equivalent mechanisms, supplemented by technical measures where required.",
      ],
    },
    {
      id: "liability",
      title: "11. Liability",
      paragraphs: [
        "Liability under this DPA is subject to the limitations in the Terms of Service unless otherwise agreed in an enterprise order form.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact",
      paragraphs: [
        `DPA and privacy inquiries: ${PRIVACY_EMAIL}`,
        `Legal: ${LEGAL_EMAIL}`,
        `To execute a custom DPA or request Sub-processor list, contact ${LEGAL_EMAIL}.`,
      ],
    },
  ],
};
