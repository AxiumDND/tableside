// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecentCampaignMenu from './RecentCampaignMenu'

describe('RecentCampaignMenu', () => {
  it('hides when there is nothing to switch to', () => {
    const { container } = render(
      <RecentCampaignMenu
        recentCampaigns={[{ name: 'Only', folder: '/only' }]}
        currentFolder="/only"
        onOpenRecent={() => {}}
      />
    )
    expect(container.firstChild).toBeNull()
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
      />
    )
    await user.click(screen.getByRole('button', { name: 'Switch campaign' }))
    expect(screen.getByText('Night City')).toBeTruthy()
    expect(screen.queryByText('Greystead')).toBeNull()
    await user.click(screen.getByRole('menuitem', { name: /Night City/ }))
    expect(onOpenRecent).toHaveBeenCalledWith('/n')
  })
})
