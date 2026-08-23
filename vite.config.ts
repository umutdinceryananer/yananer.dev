import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { profile } from './src/data/profile'

// Generate the <head> SEO/social meta + JSON-LD from the single source of truth
// (src/data/profile.ts) so index.html can never drift from the site's identity.
// Replaces the <!--app-head-meta--> placeholder in index.html at dev + build time.
function htmlHeadMeta(): Plugin {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const title = `${profile.name} — ${profile.headline}`
  const description = profile.tagline
  const url = profile.siteUrl
  const keywords = [profile.name, profile.roleTitle, profile.employer, 'Software Engineer', 'Portfolio'].join(', ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url,
    email: `mailto:${profile.email}`,
    jobTitle: profile.roleTitle,
    worksFor: { '@type': 'Organization', name: profile.employer },
    alumniOf: { '@type': 'CollegeOrUniversity', name: profile.education[0]?.institution },
    sameAs: profile.socials.map((s) => s.url),
    description,
  }

  const block = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="keywords" content="${esc(keywords)}" />`,
    `<meta name="author" content="${esc(profile.name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:site_name" content="yananer.dev" />`,
    // Square on purpose: the card type below is `summary`, which crops to a
    // small square thumbnail. Without an image every shared link — LinkedIn,
    // Slack, iMessage — renders as a blank card.
    `<meta property="og:image" content="${url}/og.jpg" />`,
    `<meta property="og:image:width" content="600" />`,
    `<meta property="og:image:height" content="600" />`,
    `<meta property="og:image:alt" content="${esc(profile.name)}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${url}/og.jpg" />`,
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
