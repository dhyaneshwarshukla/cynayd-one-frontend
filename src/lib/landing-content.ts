export const LANDING_SEO = {
  title: "CYNAYD One — AI Workspace & Business Productivity Platform",
  description:
    "CYNAYD One combines mail, drive, calendar, meetings, tasks and collaboration tools into one secure AI-powered workspace. Built for modern collaborative workflows with integrated AI.",
  featureList: [
    "CYNAYD One Mail",
    "CYNAYD One Drive",
    "CYNAYD One Calendar",
    "CYNAYD One Connect",
    "CYNAYD One Tasks",
    "CYNAYD One Meetings",
    "CYNAYD One Forms",
    "CYNAYD One Vault",
    "Workflow Automation",
    "SAML 2.0 SSO",
    "Admin Console",
    "Self-hosted deployment",
    "REST APIs & Webhooks",
  ],
};

export const BENEFIT_CARDS = [
  {
    title: "Unified Workspace",
    description: "No switching between disconnected apps. Mail, files, calendar, tasks and team chat in one place.",
    color: "blue",
  },
  {
    title: "AI Assisted Workflows",
    description: "AI summaries, task extraction, meeting detection and smart actions inside your daily work.",
    color: "indigo",
  },
  {
    title: "Secure by Design",
    description: "SSO, access controls, encrypted storage and enterprise-ready security built in from day one.",
    color: "green",
  },
  {
    title: "Self Hosted or Cloud",
    description: "Deploy on your own infrastructure with Docker and Kubernetes, or use managed cloud.",
    color: "purple",
  },
];

export type AppCard = {
  name: string;
  productName: string;
  description: string;
  features: string[];
  badge?: string;
  gradient: string;
  iconColor: string;
};

export const WORKSPACE_APPS: AppCard[] = [
  {
    name: "Mail",
    productName: "CYNAYD One Mail",
    description:
      "Smart business email with AI summaries, attachment management, workflow actions and integrated collaboration.",
    features: [
      "AI summaries",
      "Smart actions",
      "Shared mailboxes",
      "Attachments linked with Drive",
      "Calendar integration",
      "Task extraction",
    ],
    gradient: "from-emerald-50 to-green-100",
    iconColor: "bg-emerald-600",
  },
  {
    name: "Drive",
    productName: "CYNAYD One Drive",
    description:
      "Secure cloud storage with collaboration, sharing and centralized file previews.",
    features: [
      "File previews",
      "Shared folders",
      "Mail attachment integration",
      "Access permissions",
      "Team collaboration",
    ],
    gradient: "from-violet-50 to-purple-100",
    iconColor: "bg-violet-600",
  },
  {
    name: "Calendar",
    productName: "CYNAYD One Calendar",
    description:
      "Schedule meetings, manage events and power workflow execution from a single calendar layer.",
    features: [
      "Smart scheduling",
      "Meeting integrations",
      "Task/event workflows",
      "Shared calendars",
      "AI event detection",
    ],
    gradient: "from-sky-50 to-blue-100",
    iconColor: "bg-sky-600",
  },
  {
    name: "Connect",
    productName: "CYNAYD One Connect",
    description: "Team communication built directly into the workspace.",
    features: [
      "Channels",
      "Direct messaging",
      "Team collaboration",
      "Workspace communication",
    ],
    gradient: "from-rose-50 to-red-100",
    iconColor: "bg-rose-600",
  },
  {
    name: "Tasks",
    productName: "CYNAYD One Tasks",
    description: "Organize projects, assign work and track progress across teams.",
    features: [
      "Task boards",
      "Assignments",
      "Due dates",
      "Mail-to-task conversion",
      "Workflow integration",
    ],
    gradient: "from-amber-50 to-orange-100",
    iconColor: "bg-amber-600",
  },
  {
    name: "Meetings",
    productName: "CYNAYD One Meetings",
    description: "Video meetings integrated directly with your workspace.",
    features: [
      "Instant meetings",
      "Calendar integration",
      "Team collaboration",
      "Secure calls",
    ],
    gradient: "from-cyan-50 to-teal-100",
    iconColor: "bg-cyan-600",
  },
  {
    name: "Forms",
    productName: "CYNAYD One Forms",
    description: "Create forms, collect responses and automate workflows.",
    features: [
      "Drag-drop builder",
      "Response management",
      "Workflow triggers",
      "Internal and external forms",
    ],
    gradient: "from-fuchsia-50 to-pink-100",
    iconColor: "bg-fuchsia-600",
  },
  {
    name: "Vault",
    productName: "CYNAYD One Vault",
    description: "Securely store passwords, secrets and sensitive organizational data.",
    features: [
      "Secret management",
      "Team vaults",
      "Access controls",
      "Secure sharing",
    ],
    gradient: "from-slate-50 to-gray-100",
    iconColor: "bg-slate-700",
  },
  {
    name: "Workflow Automation",
    productName: "CYNAYD One Automation",
    description: "Automate repetitive work across mail, tasks, calendar and forms.",
    features: [
      "Trigger-based workflows",
      "Event automation",
      "AI actions",
      "Cross-app orchestration",
    ],
    badge: "Beta",
    gradient: "from-indigo-50 to-blue-100",
    iconColor: "bg-indigo-600",
  },
];

export const AI_FEATURES = [
  "AI mail summaries",
  "AI action recommendations",
  "Task detection from emails",
  "Meeting detection",
  "Smart workflow suggestions",
  "Context-aware assistance",
];

export const ENTERPRISE_FEATURES = [
  { title: "Single Sign-On (SSO)", description: "SAML 2.0 SSO with centralized identity for your organization." },
  { title: "Organization management", description: "Multi-tenant architecture with org-level controls." },
  { title: "Role-based permissions", description: "Granular access across apps and admin console." },
  { title: "Audit logs", description: "Complete audit trail for compliance and security monitoring." },
  { title: "Self-hosted deployment", description: "Run on your infrastructure with full data control." },
  { title: "Secure APIs", description: "Service tokens, webhooks and automation hooks for integrations." },
];

export const SELF_HOST_FEATURES = [
  "Docker deployment",
  "Kubernetes support",
  "Enterprise infrastructure",
  "Scalable architecture",
];

export const DEVELOPER_FEATURES = [
  "REST APIs",
  "Webhooks",
  "Service tokens",
  "Automation hooks",
  "Future SDK support",
];
