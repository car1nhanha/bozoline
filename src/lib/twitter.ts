export interface TweetWidgetOptions {
  theme?: 'dark' | 'light'
  dnt?: boolean
  align?: 'left' | 'center' | 'right'
  conversation?: 'none' | 'all'
  width?: number
  lang?: string
}

interface TwitterWidgetsApi {
  widgets: {
    createTweet: (
      tweetId: string,
      target: HTMLElement,
      options?: TweetWidgetOptions,
    ) => Promise<HTMLElement | undefined>
  }
}

declare global {
  interface Window {
    twttr?: TwitterWidgetsApi
  }
}

let widgetsPromise: Promise<TwitterWidgetsApi> | null = null

export function extractTweetId(url: string | undefined): string | null {
  if (!url) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
  const allowedHosts = new Set(['twitter.com', 'x.com', 'mobile.twitter.com', 'mobile.x.com'])

  if (!allowedHosts.has(host)) return null

  const match = /\/status(?:es)?\/(\d+)/i.exec(parsed.pathname)
  return match?.[1] ?? null
}

export function loadTwitterWidgets(): Promise<TwitterWidgetsApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Twitter widgets need a browser environment'))
  }

  if (window.twttr) return Promise.resolve(window.twttr)
  if (widgetsPromise) return widgetsPromise

  widgetsPromise = new Promise<TwitterWidgetsApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.charset = 'utf-8'
    script.onload = () => {
      if (window.twttr) {
        resolve(window.twttr)
      } else {
        reject(new Error('Twitter widgets loaded without exposing an API'))
      }
    }
    script.onerror = () => {
      reject(new Error('Could not load Twitter widgets'))
    }
    document.head.appendChild(script)
  })

  return widgetsPromise
}
