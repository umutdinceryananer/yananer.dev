// Put the rendered app inside <div id="root"> in the built index.html.
//
// Until this ran, the served HTML carried a full description of a person in
// JSON-LD and an empty div where that person's page should be. Google executes
// JavaScript and saw the real page; the crawlers this site is otherwise built
// for -- the ones fetching SKILL.md and llms.txt -- do not, and neither do most
// link unfurlers. This closes that gap by shipping the markup rather than the
// instructions for producing it.
//
// Runs after both Vite builds: the client build writes dist/index.html, the SSR
// build writes the module imported below. See src/entry-server.tsx for why the
// client still mounts with createRoot rather than hydrateRoot.

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

const INDEX = resolve('dist/index.html')
const ENTRY = resolve('dist-ssr/entry-server.js')

// The empty mount point Vite copies out of index.html. Matched exactly, and the
// build fails if it is not found: React would otherwise render over whatever we
// had injected, and the only symptom of a silent miss here is a served page
// that quietly went back to being a blank div.
const MOUNT = '<div id="root"></div>'

// Imported by URL rather than by a static specifier: this file lives beside
// sources that are typechecked, and dist-ssr only exists after a build.
const { render } = (await import(pathToFileURL(ENTRY).href)) as { render: () => string }

const html = readFileSync(INDEX, 'utf8')
if (!html.includes(MOUNT)) {
  throw new Error(`prerender: ${MOUNT} not found in dist/index.html`)
}

const app = render()
writeFileSync(INDEX, html.replace(MOUNT, `<div id="root">${app}</div>`))

console.log(`Prerendered the app into dist/index.html (${app.length} chars)`)
