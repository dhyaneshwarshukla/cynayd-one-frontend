import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { privacyPolicy } from "@/lib/legal/privacy-policy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: privacyPolicy.description,
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage legalDocument={privacyPolicy} />;
}
