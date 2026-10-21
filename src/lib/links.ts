export function hostnameFromUrl(url: string | undefined): string {
  if (!url) return ''

  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return ''
  }
}

export function displaySource(
  url: string | undefined,
  site: string | undefined,
): string {
  return site?.trim() || hostnameFromUrl(url) || 'Fonte'
}
