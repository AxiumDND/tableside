// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// MapStage owns the canvas/geometry layer, which jsdom cannot render. Stub it
// with a passthrough so we can exercise MapView's own tool + fog logic.
vi.mock('./MapStage', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="map-stage">{children}</div>,
  imagePointFromElement: () => null
}))

import MapView from './MapView'

const MAP_MARKDOWN = [
  '# Cave Map',
  '',
  '```map',
  'image: cave.png',
  'pins: []',
  'tokens: []',
  'tokenScale: 1',
  'pinsLocked: true',
  '```',
  '',
  '## Overview',
  'A damp cavern.'
].join('\n')

function renderMap(onChange = vi.fn()) {
  render(
    <MapView
      markdown={MAP_MARKDOWN}
      path="Maps/Cave.md"
      images={[]}
      renderRoom={(md) => <div data-testid="room">{md}</div>}
      onChange={onChange}
    />
  )
  return onChange
}

beforeEach(() => {
  // MapView reads token creature-sizes from files in some effects; stub defensively.
  ;(globalThis as unknown as { window: Window }).window.tabledm = {
    readFile: vi.fn().mockResolvedValue('')
  } as unknown as Window['tabledm']
})

describe('MapView', () => {
  it('renders the primary tool toolbar for a map note', () => {
    renderMap()
    expect(screen.getByRole('button', { name: 'Pan' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Pin' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Token' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fog' })).toBeTruthy()
  })

  it('covers the map with fog and persists it through onChange', async () => {
    const user = userEvent.setup()
    const onChange = renderMap()

    // Fog controls only appear once the Fog primary tool is active.
    expect(screen.queryByRole('button', { name: 'Cover all' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Fog' }))

    await user.click(screen.getByRole('button', { name: 'Cover all' }))

    expect(onChange).toHaveBeenCalled()
    const emitted = onChange.mock.calls.at(-1)![0] as string
    expect(emitted).toContain('```map')
    expect(emitted).toContain('fog:')
  })

  it('clears fog back out through onChange', async () => {
    const user = userEvent.setup()
    const onChange = renderMap()

    await user.click(screen.getByRole('button', { name: 'Fog' }))
    await user.click(screen.getByRole('button', { name: 'Cover all' }))
    await user.click(screen.getByRole('button', { name: 'Clear fog' }))

    const emitted = onChange.mock.calls.at(-1)![0] as string
    // A fully-cleared map serializes without a fog line.
    expect(emitted).not.toContain('fog:')
  })
})
