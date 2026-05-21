export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  list?: string[];
  subsections?: { title: string; paragraphs?: string[]; list?: string[] }[];
};

export type LegalDocument = {
  title: string;
  description: string;
  path: string;
  effectiveDate: string;
  lastUpdated: string;
  sections: LegalSection[];
};
