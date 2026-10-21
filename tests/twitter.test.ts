import { describe, expect, it } from 'vitest'
import { extractTweetId } from '../src/lib/twitter'

describe('extractTweetId', () => {
  it('accepts twitter and x status links', () => {
    expect(
      extractTweetId('https://twitter.com/OpenAI/status/1234567890'),
    ).toBe('1234567890')
    expect(
      extractTweetId('https://x.com/OpenAI/status/1234567890?s=20'),
    ).toBe('1234567890')
    expect(
      extractTweetId('https://www.twitter.com/OpenAI/status/123?ref=home'),
    ).toBe('123')
  })

  it('rejects other hosts, paths and malformed links', () => {
    expect(
      extractTweetId('https://twitter.com.example.com/OpenAI/status/123'),
    ).toBeNull()
    expect(extractTweetId('https://x.com/OpenAI')).toBeNull()
    expect(extractTweetId('not a url')).toBeNull()
    expect(extractTweetId(undefined)).toBeNull()
  })
})
