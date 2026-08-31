// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DmHeader from './DmHeader'
import type { CampaignInfo } from '../../../shared/types'

const campaign = {
  name: 'Greystead',
  folder: '/tmp/greystead',
  system: undefined,
  tree: []
} as unknown as CampaignInfo

const noopHandlers = {
  onNewCampaign: () => {},
  onOpenCampaign: () => {},
  onToggleLookup: () => {},
  onToggleCombat: () => {},
  onToggleMusic: () => {},
  onToggleHelp: () => {}
}

describe('DmHeader', () => {
  it('renders the toolbar buttons and the open campaign name', () => {
    render(
      <DmHeader campaign={campaign} rightPanel={null} combatCount={0} mixerActive={false} {...noopHandlers} />
    )
    expect(screen.getByText('Greystead')).toBeInTheDocument()
    for (const label of ['New campaign', 'Open campaign', 'Lookup', 'Combat', 'Music', 'Help']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument()
    }
  })

  it('shows a placeholder when no campaign is open', () => {
    render(
      <DmHeader campaign={null} rightPanel={null} combatCount={0} mixerActive={false} {...noopHandlers} />
    )
    expect(screen.getByText('No campaign open')).toBeInTheDocument()
  })

  it('shows the combatant count and mixer indicator', () => {
    render(
      <DmHeader campaign={campaign} rightPanel="combat" combatCount={3} mixerActive={true} {...noopHandlers} />
    )
    expect(screen.getByRole('button', { name: /Combat \(3\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Music ·/ })).toBeInTheDocument()
  })

  it('fires the matching toggle handler on click', async () => {
    const user = userEvent.setup()
    const onToggleCombat = vi.fn()
    const onToggleLookup = vi.fn()
    render(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        {...noopHandlers}
        onToggleCombat={onToggleCombat}
        onToggleLookup={onToggleLookup}
      />
    )
    await user.click(screen.getByRole('button', { name: /Combat/ }))
    await user.click(screen.getByRole('button', { name: 'Lookup' }))
    expect(onToggleCombat).toHaveBeenCalledOnce()
    expect(onToggleLookup).toHaveBeenCalledOnce()
  })
})
