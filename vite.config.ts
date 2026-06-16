import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
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
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), htmlHeadMeta()],
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
