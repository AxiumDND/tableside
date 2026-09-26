import { useEffect, useState } from 'react'
import type { AppUpdateNotice } from '../../../shared/appUpdate'
import type { ThemeId } from '../../../shared/theme'
import type { AppFolders } from '../../../shared/types'
import type { CampaignCurrency } from '../../../shared/currencies'
import {
  DEFAULT_BOX_OF_DOOM_HOLD_MS,
  boxOfDoomHoldMs
} from '../../../shared/boxOfDoom'
import { parseUpdateChannel, type UpdateChannel } from '../../../shared/updateChannel'
import {
  DEFAULT_PLAYER_IMAGE_PAD_PCT,
  clampPlayerImagePadPct
} from '../../../shared/playerImagePad'
import { Section, type HelpSection } from './help/HelpComponents'
import { SettingsSection } from './help/SettingsSection'
import { StartSection } from './help/StartSection'
import { UpdatesSection } from './help/UpdatesSection'
import { ScreensSection } from './help/ScreensSection'
import { MusicSection } from './help/MusicSection'
import { FilesSection } from './help/FilesSection'
import { CombatSection } from './help/CombatSection'
import { LookupSection } from './help/LookupSection'
import { KeysSection } from './help/KeysSection'

export default function HelpPanel({
  updateNotice,
  onCheckUpdate,
  onStartUpdate,
  theme,
  onThemeChange,
  holoPortraits = false,
  onHoloPortraitsChange,
  digitalRain = false,
  onDigitalRainChange,
  hideNpcPortraits = false,
  onHideNpcPortraitsChange,
  currencies,
  onCurrenciesChange
}: {
  updateNotice?: AppUpdateNotice | null
  onCheckUpdate?: () => void
  onStartUpdate?: () => void
  theme?: ThemeId
  onThemeChange?: (theme: ThemeId) => void
  holoPortraits?: boolean
  onHoloPortraitsChange?: (enabled: boolean) => void
  digitalRain?: boolean
  onDigitalRainChange?: (enabled: boolean) => void
  hideNpcPortraits?: boolean
  onHideNpcPortraitsChange?: (hide: boolean) => void
  currencies?: CampaignCurrency[]
  onCurrenciesChange?: (currencies: CampaignCurrency[]) => void
}) {
  const [open, setOpen] = useState<HelpSection | null>('settings')
  const [folders, setFolders] = useState<AppFolders | null>(null)
  const [boxOfDoomHoldSec, setBoxOfDoomHoldSec] = useState(String(DEFAULT_BOX_OF_DOOM_HOLD_MS / 1000))
  const [playerImagePadPct, setPlayerImagePadPct] = useState(DEFAULT_PLAYER_IMAGE_PAD_PCT)
  const [updateChannel, setUpdateChannel] = useState<UpdateChannel>('stable')

  function toggle(id: HelpSection): void {
    setOpen((prev) => (prev === id ? null : id))
  }

  useEffect(() => {
    void window.tabledm.getAppFolders().then(setFolders)
  }, [])

  useEffect(() => {
    void window.tabledm.getSettings().then((prefs) => {
      const sec = boxOfDoomHoldMs(prefs.boxOfDoomHoldSec) / 1000
      setBoxOfDoomHoldSec(String(sec))
      setPlayerImagePadPct(clampPlayerImagePadPct(prefs.playerImagePadPct))
      setUpdateChannel(parseUpdateChannel(prefs.updateChannel))
    })
  }, [])

  function saveUpdateChannel(next: UpdateChannel): void {
    setUpdateChannel(next)
    void window.tabledm.saveSettings({ updateChannel: next })
  }

  function saveBoxOfDoomHoldSec(raw: string): void {
    const sec = boxOfDoomHoldMs(raw) / 1000
    setBoxOfDoomHoldSec(String(sec))
    void window.tabledm.saveSettings({ boxOfDoomHoldSec: sec })
  }

  function savePlayerImagePadPct(raw: number | string): void {
    const pct = clampPlayerImagePadPct(raw)
    setPlayerImagePadPct(pct)
    void window.tabledm.saveSettings({ playerImagePadPct: pct })
  }

  return (
    <aside className="flex min-h-0 w-[400px] shrink-0 flex-col border-l border-line bg-ink">
      <header className="border-b border-line px-3 py-2">
        <h2 className="font-display text-lg text-amber">Help & settings</h2>
        <p className="mt-1 text-[11px] text-muted">
          Campaign look, dice fairness, and how to run the table. Click a heading to open it.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <Section id="settings" title="Settings" open={open} onToggle={toggle}>
          <SettingsSection
            theme={theme}
            onThemeChange={onThemeChange}
            holoPortraits={holoPortraits}
            onHoloPortraitsChange={onHoloPortraitsChange}
            digitalRain={digitalRain}
            onDigitalRainChange={onDigitalRainChange}
            hideNpcPortraits={hideNpcPortraits}
            onHideNpcPortraitsChange={onHideNpcPortraitsChange}
            currencies={currencies}
            onCurrenciesChange={onCurrenciesChange}
            boxOfDoomHoldSec={boxOfDoomHoldSec}
            setBoxOfDoomHoldSec={setBoxOfDoomHoldSec}
            saveBoxOfDoomHoldSec={saveBoxOfDoomHoldSec}
            playerImagePadPct={playerImagePadPct}
            savePlayerImagePadPct={savePlayerImagePadPct}
          />
        </Section>
        <Section id="start" title="Quick start" open={open} onToggle={toggle}>
          <StartSection folders={folders} />
        </Section>

        <Section id="updates" title="Updates" open={open} onToggle={toggle}>
          <UpdatesSection
            updateChannel={updateChannel}
            saveUpdateChannel={saveUpdateChannel}
            updateNotice={updateNotice}
            onCheckUpdate={onCheckUpdate}
            onStartUpdate={onStartUpdate}
          />
        </Section>

        <Section id="screens" title="Layout & player screen" open={open} onToggle={toggle}>
          <ScreensSection />
        </Section>

        <Section id="music" title="Music & sound" open={open} onToggle={toggle}>
          <MusicSection />
        </Section>

        <Section id="files" title="Files, notes & maps" open={open} onToggle={toggle}>
          <FilesSection folders={folders} />
        </Section>

        <Section id="combat" title="Combat & game night sheets" open={open} onToggle={toggle}>
          <CombatSection />
        </Section>

        <Section id="lookup" title="Lookup" open={open} onToggle={toggle}>
          <LookupSection />
        </Section>

        <Section id="keys" title="Dice & shortcuts" open={open} onToggle={toggle}>
          <KeysSection />
        </Section>
      </div>
      <footer className="border-t border-line px-3 py-2 text-[11px] leading-relaxed text-muted">
        Built by one GM.{' '}
        <a href="mailto:tableside.gm@gmail.com" className="text-amber underline hover:text-amber-dim">
          tableside.gm@gmail.com
        </a>
        . If it helped at your table, you can{' '}
        <a
          href="https://ko-fi.com/tablesidegm"
          target="_blank"
          rel="noreferrer"
          className="text-amber underline hover:text-amber-dim"
        >
          buy me a coffee
        </a>
        .
      </footer>
    </aside>
  )
}
