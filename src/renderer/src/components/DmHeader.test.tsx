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
  onToggleSidebar: () => {},
  onToggleRightPanel: () => {},
  onToggleTools: () => {},
  onToggleCombat: () => {},
  onToggleMusic: () => {},
  onToggleHelp: () => {}
}

describe('DmHeader', () => {
  it('renders the toolbar buttons and the open campaign name', () => {
    render(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen
        {...noopHandlers}
      />
    )
    expect(screen.getByText('Greystead')).toBeTruthy()
    for (const label of ['Campaign', 'Tools', 'Combat', 'Music', 'Help']) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeTruthy()
    }
  })

  it('shows a placeholder when no campaign is open', () => {
    render(
      <DmHeader
        campaign={null}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen
        {...noopHandlers}
      />
    )
    expect(screen.getByText('No campaign open')).toBeTruthy()
  })

  it('shows the combatant count and mixer indicator', () => {
    render(
      <DmHeader
        campaign={campaign}
        rightPanel="combat"
        combatCount={3}
        mixerActive={true}
        sidebarOpen
        {...noopHandlers}
      />
    )
    expect(screen.getByRole('button', { name: /Combat \(3\)/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Music ·/ })).toBeTruthy()
  })

  it('fires the matching toggle handler on click', async () => {
    const user = userEvent.setup()
    const onToggleCombat = vi.fn()
    const onToggleTools = vi.fn()
    render(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen
        {...noopHandlers}
        onToggleCombat={onToggleCombat}
        onToggleTools={onToggleTools}
      />
    )
    await user.click(screen.getByRole('button', { name: /Combat/ }))
    await user.click(screen.getByRole('button', { name: 'Tools' }))
    expect(onToggleCombat).toHaveBeenCalledOnce()
    expect(onToggleTools).toHaveBeenCalledOnce()
  })

  it('toggles the sidebar from the header icon', async () => {
    const user = userEvent.setup()
    const onToggleSidebar = vi.fn()
    const { rerender } = render(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen
        {...noopHandlers}
        onToggleSidebar={onToggleSidebar}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Hide sidebar' }))
    expect(onToggleSidebar).toHaveBeenCalledOnce()
    rerender(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen={false}
        {...noopHandlers}
        onToggleSidebar={onToggleSidebar}
      />
    )
    expect(screen.getByRole('button', { name: 'Show sidebar' })).toBeTruthy()
  })

  it('opens a recent from the Campaign menu', async () => {
    const user = userEvent.setup()
    const onOpenRecent = vi.fn()
    render(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen
        recentCampaigns={[
          { name: 'Greystead', folder: '/tmp/greystead' },
          { name: 'Other', folder: '/tmp/other' }
        ]}
        onOpenRecent={onOpenRecent}
        {...noopHandlers}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Campaign' }))
    await user.click(screen.getByRole('menuitem', { name: /Other/ }))
    expect(onOpenRecent).toHaveBeenCalledWith('/tmp/other')
  })

  it('still shows Campaign when the only recent is the open folder', async () => {
    const user = userEvent.setup()
    render(
      <DmHeader
        campaign={campaign}
        rightPanel={null}
        combatCount={0}
        mixerActive={false}
        sidebarOpen
        recentCampaigns={[{ name: 'Greystead', folder: '/tmp/greystead' }]}
        onOpenRecent={() => {}}
        {...noopHandlers}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Campaign' }))
    expect(screen.getByRole('menuitem', { name: 'Open campaign…' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'New campaign…' })).toBeTruthy()
    expect(screen.queryByText('Greystead')).toBeTruthy()
    expect(screen.queryByRole('menuitem', { name: /Greystead/ })).toBeNull()
  })
})
