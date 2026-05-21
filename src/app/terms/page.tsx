import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { termsOfService } from "@/lib/legal/terms-of-service";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: termsOfService.description,
};

export default function TermsOfServicePage() {
  return <LegalDocumentPage legalDocument={termsOfService} />;
}
