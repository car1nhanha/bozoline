import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const dataDir = join(scriptDir, '..', 'src', 'data')
const eventFilePattern = /^events-\d{4}-h[12]\.json$/
const force = process.argv.includes('--force')
const twitterHosts = new Set(['twitter.com', 'x.com', 'mobile.twitter.com', 'mobile.x.com'])

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&#x27;', "'")
    .replaceAll('&nbsp;', ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
}

function parseAttributes(tag) {
  const attributes = {}
  const pattern =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g
  let match = pattern.exec(tag)

  while (match) {
    const key = match[1]?.toLowerCase()
    const value = match[2] ?? match[3] ?? match[4] ?? ''
    if (key && !(key in attributes)) {
      attributes[key] = decodeEntities(value)
    }
    match = pattern.exec(tag)
  }

  return attributes
}

function readMeta(html) {
  const meta = {}
  const tags = html.match(/<meta\b[^>]*>/gi) ?? []

  for (const tag of tags) {
    const attributes = parseAttributes(tag)
    const key = attributes.property ?? attributes.name
    const content = attributes.content
    if (key && content && !(key in meta)) {
      meta[key] = content
    }
  }

  return meta
}

function readTitle(html) {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return match?.[1] ? decodeEntities(match[1]).trim() : ''
}

function resolveImage(image, pageUrl) {
  if (!image) return ''
  try {
    return new URL(image, pageUrl).toString()
  } catch {
    return ''
  }
}

async function fetchPreview(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'en-US,en;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const html = await response.text()
  const meta = readMeta(html)
  const pageUrl = response.url || url
  const site = meta['og:site_name'] || new URL(pageUrl).hostname.replace(/^www\./, '')
  const image =
    meta['og:image:secure_url'] ||
    meta['og:image'] ||
    meta['twitter:image'] ||
    meta['twitter:image:src'] ||
    ''

  return {
    title: meta['og:title'] || meta['twitter:title'] || readTitle(html) || undefined,
    description:
      meta['og:description'] || meta['twitter:description'] || undefined,
    image: resolveImage(image, pageUrl) || undefined,
    site,
  }
}

function isComplete(preview) {
  return Boolean(preview && preview.title && preview.image)
}

function isTwitter(url) {
  try {
    return twitterHosts.has(new URL(url).hostname.replace(/^www\./, ''))
  } catch {
    return false
  }
}

const eventFiles = (await readdir(dataDir))
  .filter((name) => eventFilePattern.test(name))
  .sort()
  .map((name) => join(dataDir, name))

let updated = 0
let skipped = 0
let failed = 0

for (const dataPath of eventFiles) {
  const raw = await readFile(dataPath, 'utf8')
  const data = JSON.parse(raw)
  if (!Array.isArray(data.events)) {
    throw new Error(`${dataPath} não contém um array "events"`)
  }

  let fileUpdated = 0

  for (const event of data.events) {
    if (!event.link) {
      skipped += 1
      continue
    }

    if (isTwitter(event.link)) {
      console.log(`skip  ${event.id} (twitter embed handled in the app)`)
      skipped += 1
      continue
    }

    if (!force && isComplete(event.preview)) {
      console.log(`keep  ${event.id}`)
      skipped += 1
      continue
    }

    try {
      const preview = await fetchPreview(event.link)
      event.preview = { ...event.preview, ...preview }
      updated += 1
      fileUpdated += 1
      console.log(`fetch ${event.id} → ${preview.site || event.link}`)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`fail  ${event.id}: ${message}`)
    }
  }

  if (fileUpdated > 0) {
    await writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  }
}

console.log(
  `\n${updated} updated · ${skipped} skipped · ${failed} failed${force ? ' · force mode' : ''}`,
)
