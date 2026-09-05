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
  /** Institution homepage. Only used to give JSON-LD's alumniOf a resolvable node. */
  url?: string
  /** When true, the degree hasn't started/finished yet — UI shows "Incoming" instead of a graduation year. */
  incoming?: boolean
}

export interface WorkEntry {
  /** Timeline order; highest = most recent (drives the numbered dot in the UI). */
  order: number
  title: string
  company: string
  period: string
  /** Optional status pill shown next to company/period, e.g. "In Development". */
  status?: string
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

export interface GrowthItem {
  /** A skill/area not strong at yet. */
  area: string
  /** One honest, forward-looking line about it. */
  note: string
}

export interface NowItem {
  title: string
  /** Short status pill, e.g. "In Development". */
  badge?: string
  /** One short line under the title. */
  description: string
  /** Optional link (repo, product, etc.) — makes the Now card clickable. */
  url?: string
  /**
   * Optional "owner/repo". When set, the UI fetches that repo's latest release
   * tag at runtime and shows it, so an actively-released project never goes
   * stale here. Deliberately opt-in: each one costs a GitHub API call.
   */
  releaseRepo?: string
}

export interface Profile {
  name: string
  /**
   * Every spelling of the name that a third party might use.
   *
   * Search engines tokenise "Dinçer" and "Dincer" as different words, so a page
   * that only ever spells it one way competes with itself. Listing the variants
   * as alternateName is what lets them resolve to one person.
   */
  alternateNames: string[]
  /** Display role, e.g. "Associate Solutions Consultant @ SAS". */
  role: string
  /** Bare job title for JSON-LD / resume.json, e.g. "Associate Solutions Consultant". */
  roleTitle: string
  /** Short form, used in prose and in the display role. */
  employer: string
  /** Full legal name, used where the organisation is named as an entity. */
  employerLegalName: string
  employerUrl: string
  /** Self-positioning headline for the page <title> / OG title, e.g. "Software Engineer & Founder". */
  headline: string
  /** Short one-liner for llms.txt / JSON-LD description. */
  tagline: string
  bio: string
  /** Human-readable, for display. Optional; omitted from JSON-LD / resume when absent. */
  location?: string
  /**
   * The same place, split up. schema.org wants PostalAddress parts, and parsing
   * them back out of `location` would break the moment that string is reworded.
   */
  address: { locality: string; country: string }
  /**
   * Site-relative path to a photo of the person, for JSON-LD's `image`.
   *
   * Deliberately a file under public/ rather than the bundled headshot in
   * src/assets: that one is emitted with a content hash in its filename, so its
   * URL changes on any rebuild and every previously-crawled reference 404s.
   */
  photo: string
  /**
   * Subjects this person has actually worked in, grounded in the projects
   * corpus. Not aspirations — see `growth` for the honest gaps.
   */
  knowsAbout: string[]
  email: string
  siteUrl: string
  githubHandle: string
  /** This portfolio's own source repo (shown in the footer). */
  sourceRepoUrl: string
  socials: SocialLink[]
  education: EducationEntry[]
  work: WorkEntry[]
  tech: TechItem[]
  growth: GrowthItem[]
  /** "Currently focused on" cards for the Now strip. */
  now: NowItem[]
  /**
   * The remote MCP server, so the site and the generated agent files describe
   * the same one.
   *
   * It used to be spelled out only inside McpModal, which told visitors about
   * it in a dialog and left llms.txt and SKILL.md silent — the machine-readable
   * files not mentioning the one thing built for machines.
   */
  mcp: {
    url: string
    tools: string[]
  }
}

export const profile: Profile = {
  name: 'Umut Dinçer Yananer',
  alternateNames: ['Umut Yananer', 'Umut Dincer Yananer'],
  role: 'Associate Solutions Consultant @ SAS',
  roleTitle: 'Associate Solutions Consultant',
  employer: 'SAS',
  employerLegalName: 'SAS Institute',
  employerUrl: 'https://www.sas.com',
  headline: 'Software Engineer & Founder',
  tagline:
    'Software engineer who builds across backend and data/ML.',
  bio:
    'Software Engineer & Founder, turning business needs into GenAI and agentic solutions. AWS Cloud Practitioner.',
  location: 'Ankara, Türkiye',
  address: { locality: 'Ankara', country: 'TR' },
  photo: '/og.jpg',
  knowsAbout: [
    'Large language model applications',
    'Retrieval-augmented generation',
    'Machine learning engineering',
    'Backend engineering',
    'Data engineering',
    'Model Context Protocol',
    'Python',
    'TypeScript',
    'Rust',
  ],
  email: 'umutdncr@gmail.com',
  siteUrl: 'https://yananer.dev',
  githubHandle: 'umutdinceryananer',
  sourceRepoUrl: 'https://github.com/umutdinceryananer/yananer.dev',
  mcp: {
    url: 'https://mcp.yananer.dev/mcp',
    tools: [
      'get_profile', 'list_projects', 'get_project', 'recommend_project',
      'assess_fit', 'explain_decision', 'run_tournament', 'contact',
    ],
  },
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
      url: 'https://bilkent.edu.tr',
    },
  ],
  work: [
    {
      order: 8,
      title: 'Associate Solutions Consultant',
      company: 'SAS Institute',
      period: 'Aug 2026 - Present',
      description:
        'Handle the technical side of platform delivery for public-sector clients, from deployment architecture and infrastructure constraints through to migration tooling and technical specification review, working with offshore engineering teams.',
    },
    {
      order: 7,
      title: 'Junior Solutions Engineer',
      company: 'SAS Institute',
      period: 'Apr 2025 - Aug 2026',
      description:
        'Delivered live technical demos and end-to-end PoCs (data pipelines, ML, RAG) to public-sector clients, scoping AI/GenAI use cases with their teams and presenting to senior decision-makers.',
    },
    {
      order: 6,
      title: 'Founding AI Engineer & Co-Founder',
      company: 'Hisar',
      period: 'Nov 2025 - Present',
      status: 'In Development',
      description:
        'Co-founded Hisar: an LLM system that analyzes financial data to surface financial-risk signals.',
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
      status: 'Exit',
      description:
        'Co-founded a veterinary SaaS startup at university; led a small team across product and engineering, from idea to paying customers.',
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
  growth: [
    { area: 'CUDA / GPU programming', note: "Haven't trained on a GPU yet; zero hands-on so far, but genuinely keen to dive in." },
    { area: 'Research depth', note: 'No research contribution yet; chasing at least a workshop paper.' },
    { area: 'Kubernetes', note: 'Deploy with Docker / Compose; no real k8s in production yet.' },
    { area: 'Advanced LLM internals', note: 'Shaky even on transformer internals; actively closing the gap.' },
    { area: 'Computer vision', note: 'Far from it, and honestly not drawn to it.' },
    { area: 'Rust / systems programming', note: 'Shipped nightlightd (a 5-crate X11 daemon, packaged for Debian and the AUR) as my first real Rust project, but still early: leveling up on ownership, unsafe boundaries and systems patterns.' },
  ],
  now: [
    { title: 'Building hisar', badge: 'In Development', description: 'LLM analysis over financial data.' },
    { title: 'Building nightlightd', badge: 'Early release', description: 'Zero-config X11 colour-temperature daemon in Rust; released and iterating.', url: 'https://github.com/umutdinceryananer/nightlightd', releaseRepo: 'umutdinceryananer/nightlightd' },
    { title: 'Closing LLM gaps', badge: 'Learning', description: 'Transformer internals; chasing a first paper.' },
  ],
}
