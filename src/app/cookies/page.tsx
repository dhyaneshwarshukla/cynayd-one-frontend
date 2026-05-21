import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import { cookiePolicy } from "@/lib/legal/cookie-policy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: cookiePolicy.description,
};

export default function CookiePolicyPage() {
  return <LegalDocumentPage legalDocument={cookiePolicy} />;
}
