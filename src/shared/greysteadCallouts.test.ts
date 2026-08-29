import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(process.cwd(), 'examples/greystead')
const QUOTE_CALLOUT = /^>\s*\[!([a-z][\w-]*)\]/i

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) out.push(...walk(path))
    else if (name.endsWith('.md')) out.push(path)
  }
  return out
}

describe('greystead callout formatting', () => {
  it('has no quote-style callouts; sheet headers use typed fences', () => {
    for (const file of walk(ROOT)) {
      const text = readFileSync(file, 'utf8').replace(/\r/g, '')
      for (const line of text.split('\n')) {
        expect(QUOTE_CALLOUT.test(line), `${file}: ${line}`).toBe(false)
      }
    }
    const bren = readFileSync(join(ROOT, 'Party/PC — Bren Oak.md'), 'utf8')
    expect(bren).toContain('[!pc]')
    expect(bren).toContain('[!/pc]')
    const mare = readFileSync(join(ROOT, 'Places/The Grey Mare.md'), 'utf8')
    expect(mare).toContain('[!shop]')
    const wolf = readFileSync(join(ROOT, 'Bestiary/Wolf.md'), 'utf8')
    expect(wolf).toContain('[!monster]')
    const night = readFileSync(join(ROOT, 'Sessions/Session 1 — Game Night Sheet.md'), 'utf8')
    expect(night).toContain('[!party]')
    expect(night).toContain('[!/party]')
    expect(night).toContain('[!scene]')
    expect(night).toContain('[!combat]')
    expect(night).toContain('[!/combat]')
  })
})
