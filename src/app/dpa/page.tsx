import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { dataProcessingAgreement } from "@/lib/legal/dpa";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Agreement",
  description: dataProcessingAgreement.description,
};

export default function DpaPage() {
  return <LegalDocumentPage legalDocument={dataProcessingAgreement} />;
}
