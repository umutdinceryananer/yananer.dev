import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { profile } from './src/data/profile'
import { projects } from './src/data/projects'

// Generate the <head> SEO/social meta + JSON-LD from the single source of truth
// (src/data/profile.ts + src/data/projects.ts) so index.html can never drift
// from the site's identity. Replaces the <!--app-head-meta--> placeholder in
// index.html at dev + build time.
//
// Why this plugin has to exist at all: the site is a client-rendered SPA, so
// anything React writes into <head> is only there after the bundle runs.
// Emitting it here puts it in the HTML that comes off the wire, which is what
// a crawler is guaranteed to see.
function htmlHeadMeta(): Plugin {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const title = `${profile.name} — ${profile.headline}`
  const url = profile.siteUrl
  const keywords = [profile.name, profile.roleTitle, profile.employer, 'Software Engineer', 'Portfolio'].join(', ')

  // Two descriptions on purpose.
  //
  // The <meta name="description"> is read by a search engine deciding which
  // person this page is about, so it leads with the full name. og/twitter
  // descriptions sit directly under a card title that already says the name,
  // where repeating it just wastes the line.
  const metaDescription = `${profile.name} — ${profile.roleTitle} at ${profile.employer}. ${profile.tagline}`
  const socialDescription = profile.tagline

  // Stable node ids. Separate nodes referring to the same thing have to say so
  // by @id, or a crawler is entitled to read them as two different people.
  const PERSON = `${url}/#person`
  const WEBSITE = `${url}/#website`
  const PROFILEPAGE = `${url}/#profilepage`

  const slug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Matched against each project's `tech` entries to fill programmingLanguage.
  // A whitelist rather than "take tech[0]": that list mixes languages with
  // frameworks, runtimes and services, and tech[0] is only a language by luck.
  const LANGUAGES = ['Python', 'TypeScript', 'JavaScript', 'Rust', 'Swift', 'Java', 'SQL', 'Go', 'C++', 'C#']

  // Works, as nodes that point back at the person.
  //
  // There are no per-project pages on this site, so each node is anchored to the
  // artefact you can actually open — the repo, or the App Store listing for the
  // one that is shipped but closed-source.
  //
  // Filtered by the data's own `isVerifiable` flag, which is exactly the right
  // test here: structured data is an assertion made to a machine that cannot
  // check it, so anything the site itself declines to vouch for (HISAR) stays
  // out. OSS contributions are excluded too — a pull request is not a work of
  // software, and typing it as one would be a small lie in a machine-readable
  // format.
  const workNodes = projects
    .filter((p) => p.kind === 'repo' && p.isVerifiable)
    .map((p) => {
      const languages = (p.tech ?? []).flatMap((t) =>
        LANGUAGES.filter((l) => new RegExp(`(^|[^A-Za-z+#])${l.replace(/[+]/g, '\\+')}([^A-Za-z+#]|$)`).test(t)),
      )
      const repo = p.isPrivate ? undefined : p.repoUrl
      return {
        // Closed-source but shipped: there is no source code to point at, so
        // typing it SoftwareSourceCode would describe something that does not
        // exist publicly.
        '@type': repo ? 'SoftwareSourceCode' : 'SoftwareApplication',
        '@id': `${url}/#project-${slug(p.name)}`,
        name: p.name,
        description: p.oneLiner,
        url: repo ?? p.liveDemoUrl,
        ...(repo ? { codeRepository: repo } : {}),
        ...(languages.length ? { programmingLanguage: [...new Set(languages)] } : {}),
        author: { '@id': PERSON },
      }
    })

  // Companies, as nodes that name the person as their founder.
  //
  // Note this asserts something different from the project nodes above, which
  // is why HISAR appears here after being filtered out of those. Those describe
  // what a piece of software does, and HISAR's own data says that cannot be
  // checked from outside. This says only that the company exists and who
  // founded it — exactly what the visible work history already states.
  const orgNodes = profile.work
    .filter((w) => w.founded)
    .map((w) => ({
      '@type': 'Organization',
      '@id': `${url}/#org-${slug(w.company)}`,
      name: w.company,
      ...(w.companyUrl ? { url: w.companyUrl } : {}),
      founder: { '@id': PERSON },
    }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': PERSON,
        name: profile.name,
        alternateName: profile.alternateNames,
        url,
        image: `${url}${profile.photo}`,
        jobTitle: profile.roleTitle,
        // The occupation, as opposed to the current job title. One is what this
        // person is; the other is what they are called this year.
        hasOccupation: { '@type': 'Occupation', name: profile.occupation },
        description: profile.tagline,
        email: `mailto:${profile.email}`,
        // The reciprocal of ProfilePage.mainEntity below. Naming the page from
        // both ends says which page is canonical *for the entity*, not merely
        // which URL this markup happens to sit on.
        mainEntityOfPage: { '@id': PROFILEPAGE },
        worksFor: {
          '@type': 'Organization',
          name: profile.employerLegalName,
          url: profile.employerUrl,
          sameAs: profile.employerSameAs,
        },
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: profile.education[0]?.institution,
          ...(profile.education[0]?.url ? { url: profile.education[0].url } : {}),
          ...(profile.education[0]?.sameAs ? { sameAs: profile.education[0].sameAs } : {}),
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: profile.address.locality,
          addressCountry: profile.address.country,
        },
        knowsAbout: profile.knowsAbout,
        award: profile.awards,
        sameAs: [...profile.socials.map((s) => s.url), ...profile.identityUrls],
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE,
        url,
        name: profile.name,
        publisher: { '@id': PERSON },
      },
      {
        '@type': 'ProfilePage',
        '@id': PROFILEPAGE,
        url,
        isPartOf: { '@id': WEBSITE },
        mainEntity: { '@id': PERSON },
      },
      ...orgNodes,
      ...workNodes,
    ],
  }

  const block = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(metaDescription)}" />`,
    `<meta name="keywords" content="${esc(keywords)}" />`,
    `<meta name="author" content="${esc(profile.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(socialDescription)}" />`,
    // The page is one person's profile, and saying so is the whole point of the
    // exercise. There is only one route, so this never needs to vary.
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:site_name" content="yananer.dev" />`,
    // Square on purpose: the card type below is `summary`, which crops to a
    // small square thumbnail. Without an image every shared link — LinkedIn,
    // Slack, iMessage — renders as a blank card.
    //
    // Deliberately NOT summary_large_image: that card is 1.91:1 and would crop
    // this 600x600 headshot to a band across the eyes. Switching it needs a
    // 1200x630 image first, not just a different tag.
    `<meta property="og:image" content="${url}${profile.photo}" />`,
    `<meta property="og:image:width" content="600" />`,
    `<meta property="og:image:height" content="600" />`,
    `<meta property="og:image:alt" content="${esc(profile.name)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(socialDescription)}" />`,
    `<meta name="twitter:image" content="${url}${profile.photo}" />`,
    `<meta name="twitter:image:alt" content="${esc(profile.name)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`,
  ].join('\n    ')

  return {
    name: 'html-head-meta',
    transformIndexHtml(html) {
      return html.replace('<!--app-head-meta-->', block)
    },
  }
}

// Teach the CSP about the inline scripts we actually ship.
//
// `script-src 'self'` does not cover inline <script> blocks -- only files. The
// theme resolver at the top of index.html has to be inline (an external file
// would be a blocking round trip before the first paint, which is the whole
// thing it exists to avoid), so the CSP has to name it by hash instead.
//
// The hash is computed here, from the built HTML, rather than pasted into
// public/_headers by hand: it covers the script character for character, so one
// space added to it would invalidate a hand-written constant, and the only symptom
// would be a site that quietly stops remembering its theme. This cannot drift.
//
// It rewrites dist/_headers, after Vite has copied it out of public/.
function cspInlineScriptHashes(): Plugin {
  // Anything with a src is already covered by 'self'. ld+json is data, not
  // script, and browsers do not gate it on script-src.
  const INLINE = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi
  const EXECUTABLE = ['', 'module', 'text/javascript', 'application/javascript']
  const TOKEN = '{{INLINE_SCRIPT_HASHES}}'

  let outDir = 'dist'

  return {
    name: 'csp-inline-script-hashes',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const headers = resolve(outDir, '_headers')
      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8')

      const hashes: string[] = []
      for (const [, attrs, body] of html.matchAll(INLINE)) {
        const type = (attrs.match(/type="([^"]*)"/)?.[1] ?? '').toLowerCase()
        if (!EXECUTABLE.includes(type)) continue
        // Newlines first. CSP hashes the script as the HTML parser hands it over,
        // and the parser normalises every CRLF in the source to a bare LF before
        // anyone sees it -- so hashing the file's raw bytes produces a hash the
        // browser will never ask for. It also means this build agrees with the one
        // on the Linux build machine, which checks the same file out as LF.
        const text = body.replace(/\r\n/g, '\n')
        hashes.push(`'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`)
      }

      const source = readFileSync(headers, 'utf8')
      const found = source.split(TOKEN).length - 1
      if (found !== 1) {
        // Failing the build is the point. At zero the header ships with no hash,
        // the theme script is blocked, and nothing in the output looks wrong. Above
        // one there is a second copy -- prose quoting the token, most likely -- and
        // a single replace would land on whichever came first.
        throw new Error(`_headers must contain ${TOKEN} exactly once, found ${found}.`)
      }
      writeFileSync(headers, source.replace(TOKEN, hashes.join(' ')))

      this.info(`CSP: allowed ${hashes.length} inline script(s) by hash`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), htmlHeadMeta(), cspInlineScriptHashes()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: '.',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || '';
          const ext = name.split('.').pop() || 'asset';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/img/[name]-[hash][extname]';
          }
          if (ext === 'pdf') {
            return 'assets/pdf/[name][extname]';
          }
          if (ext === 'md') {
            return '[name][extname]';
          }
          return 'assets/[ext]/[name]-[hash][extname]';
        }
      },
    },
  },
  publicDir: 'public',
  server: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
