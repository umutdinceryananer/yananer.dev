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
  // `location` (below) is optional and not currently set; it only feeds JSON-LD / resume.json.
  tagline:
    'Software engineer who builds across backend and data/ML.',
  bio:
    'Software engineer who builds LLM agents and data/ML systems end-to-end, and tinkers with whatever else catches my interest.',
  // location: 'Ankara, Türkiye', // TODO(umut): set if you want it surfaced
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
      order: 6,
      title: 'Junior Solution Engineer',
      company: 'SAS Institute',
      period: 'Apr 2025 - Present',
      description:
        'Developing analytics solutions using SAS and SAS Viya through case studies, while strengthening open-source skills by creating Python-based projects in data and analytics.',
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
        'Developed a WebRTC module frontend with React and TypeScript, ensured code reliability through problem-solving, and used Figma for design and prototyping to align with the technical manager.',
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
      title: 'Founding Developer',
      company: 'Petbilir',
      period: 'Feb 2021 - Aug 2023',
      description:
        'Led a 6-person team in strategic decision-making, collaboration, and execution, adopting React, Node.js, Express, and TailwindCSS, while securing two awards and exclusive investment opportunities.',
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
