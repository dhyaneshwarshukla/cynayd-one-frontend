import { COMPANY_NAME, PRIVACY_EMAIL, PRODUCT_NAME } from "./links";
import type { LegalDocument } from "./types";

export const cookiePolicy: LegalDocument = {
  title: "Cookie Policy",
  path: "/cookies",
  effectiveDate: "May 21, 2026",
  lastUpdated: "May 21, 2026",
  description: `This Cookie Policy explains how ${COMPANY_NAME} uses cookies and similar technologies on websites and applications for ${PRODUCT_NAME}.`,
  sections: [
    {
      id: "what",
      title: "1. What are cookies?",
      paragraphs: [
        "Cookies are small text files stored on your device. Similar technologies include local storage, session storage, and pixels. We use them to operate the service, remember preferences, and understand usage.",
      ],
    },
    {
      id: "types",
      title: "2. Types of cookies we use",
      subsections: [
        {
          title: "Strictly necessary",
          paragraphs: [
            "Required for authentication, security, load balancing, and session management. These cannot be disabled without affecting core functionality.",
          ],
          list: [
            "Session and authentication tokens",
            "CSRF and security cookies",
            "Cookie consent preferences (where applicable)",
          ],
        },
        {
          title: "Functional",
          paragraphs: [
            "Remember settings such as theme, language, or sidebar state to improve your experience.",
          ],
        },
        {
          title: "Analytics",
          paragraphs: [
            "Help us understand how visitors use our marketing site and product (e.g., page views, performance). We may use services such as Google Analytics where disclosed and subject to your consent where required by law.",
          ],
        },
      ],
    },
    {
      id: "third-party",
      title: "3. Third-party cookies",
      paragraphs: [
        "Payment providers, embedded content, or SSO identity providers may set their own cookies when you interact with those features. Their use is governed by their respective policies.",
      ],
    },
    {
      id: "choices",
      title: "4. Your choices",
      list: [
        "Browser settings: most browsers let you block or delete cookies",
        "Product settings: some functional preferences are stored in local storage and can be cleared via browser dev tools or logout",
        "Where we display a cookie banner, you may accept or reject non-essential cookies",
        "Opt-out of Google Analytics via Google's tools or browser add-ons where applicable",
      ],
    },
    {
      id: "duration",
      title: "5. Retention",
      paragraphs: [
        "Session cookies expire when you close the browser. Persistent cookies remain until they expire or you delete them — typically from a few days to twelve months depending on purpose.",
      ],
    },
    {
      id: "updates",
      title: "6. Updates",
      paragraphs: [
        "We may update this policy when our practices change. Check the effective date at the top of this page.",
      ],
    },
    {
      id: "contact",
      title: "7. Contact",
      paragraphs: [
        `Questions: ${PRIVACY_EMAIL}`,
        "See also our Privacy Policy for how we process personal data.",
      ],
    },
  ],
};
