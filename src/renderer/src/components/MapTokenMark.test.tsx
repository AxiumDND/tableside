// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MapTokenMark from './MapTokenMark'

describe('MapTokenMark', () => {
  it('renders condition chips without HP numbers', () => {
    render(
      <MapTokenMark
        token={{
          id: 'tok-1',
          x: 0.4,
          y: 0.5,
          size: 0.05,
          label: 'Wolf',
          kind: 'monster',
          imageSrc: null,
          overlayTags: [
            { label: 'Bloodied', tone: 'blood' },
            { label: 'Poisoned', tone: 'muted' }
          ]
        }}
      />
    )
    expect(screen.getByText('Wolf')).toBeTruthy()
    expect(screen.getByText('Bloodied')).toBeTruthy()
    expect(screen.getByText('Poisoned')).toBeTruthy()
    expect(screen.queryByText(/hp|wp|hunger/i)).toBeNull()
  })
})
