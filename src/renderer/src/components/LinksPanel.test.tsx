// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import LinksPanel from './LinksPanel'

describe('LinksPanel', () => {
  it('groups curated links by category', () => {
    render(<LinksPanel />)

    expect(screen.getByText('Official & characters')).toBeTruthy()
    expect(screen.getByText('Maps & visuals')).toBeTruthy()
    expect(screen.getByText('GM prep & advice')).toBeTruthy()
    expect(screen.getByText('Generators & improvisation')).toBeTruthy()

    expect(screen.getByRole('link', { name: 'D&D Beyond' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Inkarnate' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Sly Flourish' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Donjon' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Fantasy Name Generators' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Auto Roll Tables' })).toBeTruthy()
  })
})
