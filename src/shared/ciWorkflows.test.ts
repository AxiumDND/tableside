import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function workflow(name: string): string {
  return readFileSync(resolve(ROOT, '.github/workflows', name), 'utf8')
}

/** Body of a top-level job (`  jobId:`) through the next job or EOF. */
function jobBody(yaml: string, jobId: string): string {
  const lines = yaml.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const start = lines.findIndex((line) => line === `  ${jobId}:`)
  if (start < 0) throw new Error(`missing job ${jobId}`)
  let end = lines.length
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^ {2}[A-Za-z0-9_-]+:\s*$/.test(lines[i])) {
      end = i
      break
    }
  }
  return lines.slice(start, end).join('\n')
}

function runCommands(job: string): string[] {
  return [...job.matchAll(/^[ \t]+- run: (.+)$/gm)].map((match) => match[1])
}

describe('CI workflows', () => {
  it('runs the same Ubuntu PR checks before a tagged Windows release', () => {
    const prChecks = jobBody(workflow('build.yml'), 'checks')
    const releaseChecks = jobBody(workflow('release.yml'), 'checks')
    expect(runCommands(releaseChecks)).toEqual(runCommands(prChecks))
    expect(releaseChecks).toMatch(/node-version: 22/)
    expect(jobBody(workflow('release.yml'), 'windows')).toMatch(/needs: checks/)
  })

  it('finds jobs when workflow YAML uses CRLF line endings', () => {
    const crlf = workflow('release.yml').replace(/\n/g, '\r\n')
    expect(runCommands(jobBody(crlf, 'checks'))).toContain('npm run lint')
    expect(jobBody(crlf, 'windows')).toMatch(/needs: checks/)
  })

  it('publishes every v* tag as a pre-release until it is promoted', () => {
    const windows = jobBody(workflow('release.yml'), 'windows')
    expect(windows).toMatch(/prerelease:\s*true/)
    expect(windows).toMatch(/make_latest:\s*false/)
  })

  it('promotes a chosen tag to GitHub Latest', () => {
    const yaml = workflow('promote-release.yml')
    expect(yaml).toMatch(/workflow_dispatch/)
    expect(yaml).toMatch(/gh release edit/)
    expect(yaml).toMatch(/--prerelease=false/)
    expect(yaml).toMatch(/--latest/)
  })
})
