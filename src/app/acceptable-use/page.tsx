import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { acceptableUsePolicy } from "@/lib/legal/acceptable-use";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: acceptableUsePolicy.description,
};

export default function AcceptableUsePolicyPage() {
  return <LegalDocumentPage legalDocument={acceptableUsePolicy} />;
}
