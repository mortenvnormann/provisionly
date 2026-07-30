export const LEGAL_META = {
  controllerName: "[Your full name]",
  controllerCountry: "Denmark",
  contactEmail: "[privacy@yourdomain.com]",
  lastUpdated: "2026-05-26",
  appName: "Provisionly",
} as const;

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

function p(...parts: string[]): string[] {
  return parts;
}

export const privacyPolicy: LegalSection[] = [
  {
    id: "who",
    title: "1. Who we are",
    paragraphs: p(
      `${LEGAL_META.appName} is operated by ${LEGAL_META.controllerName}, an individual based in ${LEGAL_META.controllerCountry}.`,
      `For questions about this policy or your personal data, contact us at ${LEGAL_META.contactEmail}.`,
      `Last updated: ${LEGAL_META.lastUpdated}.`,
    ),
  },
  {
    id: "what",
    title: "2. What Provisionly is",
    paragraphs: p(
      `${LEGAL_META.appName} is a mobile-first web app for collaborative grocery lists and recipes. You can use it with an account (data stored in the cloud) or in guest mode (data stored only on your device).`,
    ),
  },
  {
    id: "collect",
    title: "3. Data we collect",
    paragraphs: p(
      "The data we process depends on how you use the app.",
      "Account holders: email address and password (for authentication); first name, last name, and display name (profile); language preference; grocery lists, list items, recipes, and ingredients you create; list membership and sharing settings; and technical data needed to run the service (such as session cookies).",
      "When you share a list or recipe, other users you invite may see your display name and the content you share. List and recipe share links can be opened by anyone with the link until the link expires (invite links expire after 72 hours).",
      "Guest mode (without an account): lists and items are stored in your browser’s local storage on your device. We do not receive guest list content on our servers. A small cookie marks guest mode on your device.",
      "Signed-in offline use: when you are offline, changes may be queued in your browser’s local storage and synced when you are back online. We also cache list data locally to improve offline access.",
      "Analytics and performance: we use Vercel Analytics and Speed Insights to collect aggregated, privacy-oriented usage and performance metrics (for example page views and web vitals). We do not use these tools to sell your data or to build advertising profiles.",
    ),
  },
  {
    id: "use",
    title: "4. How we use your data",
    paragraphs: p(
      "We use your data to provide, maintain, and improve the app; to authenticate you; to sync your lists and recipes across devices; to enable sharing with people you choose; to remember your language preference; to keep the service secure; and to understand performance and reliability.",
      "We do not sell your personal data.",
    ),
  },
  {
    id: "legal-basis",
    title: "5. Legal basis (GDPR)",
    paragraphs: p(
      "If you are in the European Economic Area (EEA) or the UK, we process personal data on the following bases:",
      "Performance of a contract: processing needed to provide the app when you create an account and use cloud features (for example storing your lists and recipes).",
      "Legitimate interests: keeping the service secure, preventing abuse, and measuring aggregated performance and usage, where those interests are not overridden by your rights.",
      "Consent: where required by law (for example certain optional processing). You may withdraw consent at any time by contacting us.",
    ),
  },
  {
    id: "cookies",
    title: "6. Cookies and local storage",
    paragraphs: p(
      "Cookies: we use essential cookies to keep you signed in (via our authentication provider), to remember your language preference (NEXT_LOCALE), and to mark guest mode (provisionly_guest). These are necessary for the app to work as you expect.",
      "Local storage: guest lists, offline sync queues, list cache, and similar data may be stored in your browser’s local storage. You can clear this data by clearing site data in your browser or by deleting guest lists in the app.",
      "Service worker: if you install or use the app as a PWA, a service worker may cache parts of the app for offline use.",
      "Analytics: Vercel may set cookies or similar technologies for Analytics and Speed Insights. See Vercel’s privacy documentation for details.",
    ),
  },
  {
    id: "sharing",
    title: "7. Who we share data with",
    paragraphs: p(
      "We use trusted service providers (data processors) to run the app:",
      "Supabase — database, authentication, and realtime sync. Your account and content data are stored with Supabase.",
      "Vercel — hosting, content delivery, analytics, and performance monitoring.",
      "These providers process data on our instructions and under agreements that require appropriate safeguards. They may process data outside the EEA; see section 9.",
      "We may disclose data if required by law or to protect rights, safety, and security.",
    ),
  },
  {
    id: "retention",
    title: "8. How long we keep data",
    paragraphs: p(
      "Account data is kept until you delete your account. When you delete your account in Settings, we permanently delete your account and associated lists and recipes from our systems, subject to short backup retention by our providers.",
      "Share links for lists and recipes expire after 72 hours unless otherwise stated in the app. People who already joined keep their access after the link expires.",
      "Server and analytics logs are retained according to our providers’ policies, typically for a limited period.",
      "Guest data on your device remains until you clear it or remove it in the app.",
    ),
  },
  {
    id: "transfers",
    title: "9. International transfers",
    paragraphs: p(
      "Supabase and Vercel are companies based in the United States. They may process your data in the EU/EEA and in other countries. Where data is transferred outside the EEA, we rely on appropriate safeguards such as Standard Contractual Clauses and our providers’ data processing terms.",
    ),
  },
  {
    id: "rights",
    title: "10. Your rights",
    paragraphs: p(
      "Depending on where you live, you may have the right to: access your data; correct inaccurate data (you can update your profile in Settings); delete your data (use Delete account in Settings); restrict or object to certain processing; data portability; and withdraw consent where processing is based on consent.",
      "To exercise rights that are not available in the app, email us at " +
        LEGAL_META.contactEmail +
        ". We will respond within the time required by applicable law (generally one month under GDPR).",
      "You may lodge a complaint with your local supervisory authority. In Denmark, this is Datatilsynet (www.datatilsynet.dk).",
    ),
  },
  {
    id: "children",
    title: "11. Children",
    paragraphs: p(
      `${LEGAL_META.appName} is not directed at children under 16. Do not use the app if you are under 16 without parental consent. If you believe we have collected data from a child, contact us and we will delete it.`,
    ),
  },
  {
    id: "changes",
    title: "12. Changes to this policy",
    paragraphs: p(
      "We may update this policy from time to time. We will post the new version in the app and update the “Last updated” date. For material changes, we may also notify you by email if we have your address.",
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    paragraphs: p(
      `Questions about privacy: ${LEGAL_META.contactEmail}`,
      `Data controller: ${LEGAL_META.controllerName}, ${LEGAL_META.controllerCountry}.`,
    ),
  },
];

export const termsOfUse: LegalSection[] = [
  {
    id: "acceptance",
    title: "1. Acceptance",
    paragraphs: p(
      `By using ${LEGAL_META.appName}, you agree to these Terms of Use and our Privacy Policy. If you do not agree, do not use the app.`,
    ),
  },
  {
    id: "service",
    title: "2. The service",
    paragraphs: p(
      `${LEGAL_META.appName} provides grocery list and recipe tools for personal use. We may change, suspend, or discontinue features at any time.`,
      "Guest mode stores data only on your device. Account holders’ data is stored in the cloud so you can sync and share.",
    ),
  },
  {
    id: "account",
    title: "3. Your account",
    paragraphs: p(
      "You are responsible for keeping your login credentials secure and for activity under your account.",
      "You must provide accurate information and be at least 16 years old (or have parental consent where required).",
      "You may delete your account at any time in Settings.",
    ),
  },
  {
    id: "acceptable-use",
    title: "4. Acceptable use",
    paragraphs: p(
      "You agree not to misuse the service, including: breaking the law; attempting to access others’ data without permission; disrupting the service; uploading malware; or harassing others.",
      "You are responsible for content you create and share, including list and recipe names.",
    ),
  },
  {
    id: "sharing",
    title: "5. Sharing",
    paragraphs: p(
      "When you share a list or recipe, anyone with the link (or invited members) may see the content you share. Only share with people you trust.",
    ),
  },
  {
    id: "disclaimer",
    title: "6. Disclaimer",
    paragraphs: p(
      `The app is provided “as is” and “as available” without warranties of any kind, to the fullest extent permitted by law. We do not guarantee uninterrupted or error-free operation.`,
      "Grocery and recipe information is for your convenience only. Always verify allergens, quantities, and food safety yourself.",
    ),
  },
  {
    id: "liability",
    title: "7. Limitation of liability",
    paragraphs: p(
      "To the fullest extent permitted by applicable law, we are not liable for indirect, incidental, special, or consequential damages, or for loss of data, profits, or goodwill arising from your use of the app.",
      "Our total liability for any claim relating to the service is limited to the amount you paid us in the twelve months before the claim (or EUR 50 if you use the free service), except where liability cannot be limited by law.",
    ),
  },
  {
    id: "law",
    title: "8. Governing law",
    paragraphs: p(
      "These terms are governed by the laws of Denmark, without regard to conflict-of-law rules. Courts in Denmark have exclusive jurisdiction, subject to mandatory consumer protections in your country of residence.",
    ),
  },
  {
    id: "privacy",
    title: "9. Privacy",
    paragraphs: p(
      "Our Privacy Policy explains how we handle personal data. It forms part of your agreement with us.",
    ),
  },
  {
    id: "contact",
    title: "10. Contact",
    paragraphs: p(`Questions about these terms: ${LEGAL_META.contactEmail}`),
  },
];
