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
    expect(screen.getByRole('button', { name: 'Fit' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Scale map' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Line' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cone' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Round' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Square' })).toBeTruthy()
    expect(screen.getByText(/Scale map sets 5 ft squares/)).toBeTruthy()
  })

  it('arms Round and asks for a center click in feet', async () => {
    const user = userEvent.setup()
    renderMap()
    await user.click(screen.getByRole('button', { name: 'Round' }))
    expect(screen.getByText(/Click the center \(30 ft radius\)/)).toBeTruthy()
  })

  it('arms Square and asks for a center click in feet', async () => {
    const user = userEvent.setup()
    renderMap()
    await user.click(screen.getByRole('button', { name: 'Square' }))
    expect(screen.getByText(/Click the center \(30 ft square\)/)).toBeTruthy()
  })

  it('arms Cone with a drag-to-aim hint', async () => {
    const user = userEvent.setup()
    renderMap()
    await user.click(screen.getByRole('button', { name: 'Cone' }))
    expect(screen.getByText(/Click origin, drag to aim \(30 ft cone\)/)).toBeTruthy()
  })

  it('arms Scale map and asks for two clicks', async () => {
    const user = userEvent.setup()
    renderMap()
    await user.click(screen.getByRole('button', { name: 'Scale map' }))
    expect(screen.getByText(/Click a printed grid corner/)).toBeTruthy()
  })

  it('does not show an all-token Size slider', async () => {
    const user = userEvent.setup()
    renderMap()
    await user.click(screen.getByRole('button', { name: 'Token' }))
    expect(screen.getByText(/Pick a creature, then click the map/)).toBeTruthy()
    expect(screen.queryByText(/^Size$/)).toBeNull()
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
