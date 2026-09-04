// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LinksPanel from './LinksPanel'

describe('LinksPanel', () => {
  it('groups curated links by DM-prep category', () => {
    render(<LinksPanel />)

    expect(screen.getByText('Rules & characters')).toBeTruthy()
    expect(screen.getByText('Maps & battlemaps')).toBeTruthy()
    expect(screen.getByText('Tokens, portraits & free art')).toBeTruthy()
    expect(screen.getByText('GM prep & advice')).toBeTruthy()
    expect(screen.getByText('Generators & improvisation')).toBeTruthy()
    expect(screen.getByText('Music & ambience')).toBeTruthy()
    expect(screen.getByText('Puzzles, traps & tables')).toBeTruthy()

    expect(screen.getByRole('link', { name: 'D&D Beyond' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Dungeon Scrawl' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Tabletop Audio' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Kobold Fight Club' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Forgotten Adventures' })).toBeTruthy()
  })
})
