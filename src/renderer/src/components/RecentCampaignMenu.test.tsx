// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecentCampaignMenu from './RecentCampaignMenu'

const handlers = {
  onOpenCampaign: () => {},
  onNewCampaign: () => {}
}

describe('RecentCampaignMenu', () => {
  it('stays visible with Open and New when there is nothing to switch to', async () => {
    const user = userEvent.setup()
    const onOpenCampaign = vi.fn()
    const onNewCampaign = vi.fn()
    render(
      <RecentCampaignMenu
        recentCampaigns={[{ name: 'Only', folder: '/only' }]}
        currentFolder="/only"
        onOpenRecent={() => {}}
        onOpenCampaign={onOpenCampaign}
        onNewCampaign={onNewCampaign}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Campaign' }))
    expect(screen.queryByText('Recent')).toBeNull()
    expect(screen.queryByText('Only')).toBeNull()
    await user.click(screen.getByRole('menuitem', { name: 'Open campaign…' }))
    expect(onOpenCampaign).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Campaign' }))
    await user.click(screen.getByRole('menuitem', { name: 'New campaign…' }))
    expect(onNewCampaign).toHaveBeenCalledOnce()
  })

  it('lists other campaigns and opens one', async () => {
    const user = userEvent.setup()
    const onOpenRecent = vi.fn()
    render(
      <RecentCampaignMenu
        recentCampaigns={[
          { name: 'Greystead', folder: '/g' },
          { name: 'Night City', folder: '/n' }
        ]}
        currentFolder="/g"
        onOpenRecent={onOpenRecent}
        {...handlers}
      />
    )
    await user.click(screen.getByRole('button', { name: 'Campaign' }))
    expect(screen.getByText('Night City')).toBeTruthy()
    expect(screen.queryByText('Greystead')).toBeNull()
    expect(screen.getByText('Recent')).toBeTruthy()
    await user.click(screen.getByRole('menuitem', { name: /Night City/ }))
    expect(onOpenRecent).toHaveBeenCalledWith('/n')
  })
})
