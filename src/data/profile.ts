// Single source of truth for personal/profile data.
//
// PURE DATA — no React/JSX imports. This file is consumed BOTH by the React
// components (src/components/**) AND by the build-time codegen script
// (scripts/generate-agent-files.ts), which runs under Node/tsx and therefore
// cannot import anything that pulls in React.

export interface SocialLink {
  label: string
  url: string
}

export interface EducationEntry {
  institution: string
  degree: string
  field: string
  startYear: string
  endYear: string
  /** When true, the degree hasn't started/finished yet — UI shows "Incoming" instead of a graduation year. */
  incoming?: boolean
}

export interface WorkEntry {
  /** Timeline order; highest = most recent (drives the numbered dot in the UI). */
  order: number
  title: string
  company: string
  period: string
  description: string
}

export interface TechItem {
  name: string
  description: string
  /** Favourite marker (red heart in the UI). */
  hasHeart?: boolean
  /** "Used in this portfolio" pulse dot + tooltip in the UI. */
  hasTooltip?: boolean
}

export interface Profile {
  name: string
  /** Display role, e.g. "Junior Solution Engineer @ SAS". */
  role: string
  /** Bare job title for JSON-LD / resume.json, e.g. "Junior Solution Engineer". */
  roleTitle: string
  employer: string
  /** Short one-liner for llms.txt / JSON-LD description. */
  tagline: string
  bio: string
  /** Optional; omitted from JSON-LD / resume when absent. */
  location?: string
  email: string
  siteUrl: string
  githubHandle: string
  /** This portfolio's own source repo (shown in the footer). */
  sourceRepoUrl: string
  socials: SocialLink[]
  education: EducationEntry[]
  work: WorkEntry[]
  tech: TechItem[]
}

export const profile: Profile = {
  name: 'Umut Dinçer Yananer',
  role: 'Junior Solution Engineer @ SAS',
  roleTitle: 'Junior Solution Engineer',
  employer: 'SAS',
  tagline:
    'Software engineer who builds across backend and data/ML.',
  bio:
    'Software engineer and founder — I turn customer problems into deployed AI systems: agentic LLM apps in Python and React, with production SaaS shipped to paying customers. I tinker with whatever else catches my interest.',
  location: 'Ankara, Türkiye',
  email: 'umutdncr@gmail.com',
  siteUrl: 'https://yananer.dev',
  githubHandle: 'umutdinceryananer',
  sourceRepoUrl: 'https://github.com/umutdinceryananer/yananer.dev',
  socials: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/umut-yananer/' },
    { label: 'GitHub', url: 'https://github.com/umutdinceryananer' },
  ],
  education: [
    {
      institution: 'Ihsan Dogramaci Bilkent University',
      degree: 'BSc',
      field: 'Information Systems and Technologies',
      startYear: '2020',
      endYear: '2025',
    },
  ],
  work: [
    {
      order: 7,
      title: 'Junior Solution Engineer',
      company: 'SAS Institute',
      period: 'Apr 2025 - Present',
      description:
        "Deliver live technical demos and end-to-end PoCs to public-sector clients — data pipelines, ML, synthetic data, and RAG — scoping AI/GenAI use cases directly with clients' technical and business teams and presenting to senior decision-makers. Won a competitive PoC evaluation against an external subcontractor.",
    },
    {
      order: 6,
      title: 'Founding AI Engineer & Co-Founder',
      company: 'Hisar',
      period: 'Nov 2025 - Present',
      description:
        'Co-founded Hisar (in development): a system that analyzes SEC filings to surface financial risk signals. Built an evaluation harness (labeled gold-set + return-based benchmarks), multi-step LLM workflows in Python/LangChain with multi-provider fallback, a GraphRAG + ontology retrieval layer, and a FastAPI backend (LLM scoring + FRED macro data) with a React frontend.',
    },
    {
      order: 5,
      title: 'Business Analyst Intern',
      company: 'Meteksan Defence',
      period: 'Aug 2024 - Sep 2024',
      description:
        'Managed an IT asset auditing project, implementing an SAP-based tracking system for 1,600 assets, improving allocation accuracy and achieving a 92% tracking precision.',
    },
    {
      order: 4,
      title: 'Software Designer Intern',
      company: 'Orion Innovation',
      period: 'Sep 2023 - Jan 2024',
      description:
        'Rebuilt a legacy WebRTC module from scratch in TypeScript/React across the client-side stack; scoped requirements with stakeholders and prototyped designs in Figma.',
    },
    {
      order: 3,
      title: 'Software Development Intern',
      company: 'TUV Austria',
      period: 'Aug 2023 - Oct 2023',
      description:
        'Improved PwnDoc Pentest Report Generator by developing frontend and backend features, enhancing reliability and performance through QA testing with Selenium.',
    },
    {
      order: 2,
      title: 'UI Developer Intern',
      company: 'Jotform',
      period: 'Jun 2022 - Aug 2022',
      description:
        'Led the design implementation of the URL Redirection Tool with a 12-member team, preventing URL mismatches, enhancing UX, and ensuring future development through detailed documentation.',
    },
    {
      order: 1,
      title: 'Founding Product Engineer & Co-Founder',
      company: 'Petbilir / Petlyst',
      period: 'Feb 2021 - Aug 2023',
      description:
        'Co-founded a veterinary SaaS startup while at university; led a 6-person team and grew it to 9 paying clinic customers. Shipped an automated vaccination-reminder system on AWS (EventBridge, Lambda, PostgreSQL) — the most-adopted feature — driving the product from concept through customer development.',
    },
  ],
  tech: [
    { name: 'Python', description: 'Core Language', hasHeart: true },
    { name: 'Machine Learning', description: 'AI', hasHeart: true },
    { name: 'Data Science', description: 'Data', hasHeart: true },
    { name: 'Data Visualization', description: 'Data', hasHeart: true },
    { name: 'Java', description: 'OOP' },
    { name: 'Javascript', description: 'Web Dev' },
    { name: 'AWS', description: 'Cloud Services', hasHeart: true },
    { name: 'React', description: 'UI Framework', hasTooltip: true },
    { name: 'Typescript', description: 'Type Safety', hasTooltip: true },
    { name: 'Node.js', description: 'Runtime Environment' },
    { name: 'Express', description: 'Web Framework' },
    { name: 'Selenium', description: 'Test Automation' },
    { name: 'Docker', description: 'Containerization' },
    { name: 'Arduino', description: 'Embedded Systems', hasHeart: true },
    { name: 'MongoDB', description: 'NoSQL Database' },
    { name: 'MySQL', description: 'SQL Database' },
    { name: 'PostgreSQL', description: 'Relational DB', hasHeart: true },
    { name: 'Spring', description: 'Java Framework' },
    { name: 'Vite', description: 'Build Tool', hasTooltip: true },
    { name: 'Tailwind', description: 'CSS Framework', hasTooltip: true },
    { name: 'Git', description: 'Version Control', hasTooltip: true },
  ],
}
