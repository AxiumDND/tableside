import { THEME_BLURBS, THEME_IDS, THEME_LABELS, type ThemeId } from '../../../../shared/theme'
import type { CampaignCurrency } from '../../../../shared/currencies'
import {
  MAX_BOX_OF_DOOM_HOLD_MS,
  MIN_BOX_OF_DOOM_HOLD_MS
} from '../../../../shared/boxOfDoom'
import {
  DEFAULT_PLAYER_IMAGE_PAD_PCT,
  MAX_PLAYER_IMAGE_PAD_PCT,
  MIN_PLAYER_IMAGE_PAD_PCT
} from '../../../../shared/playerImagePad'
import CurrenciesSettings from '../CurrenciesSettings'
import { Action, Code, Sub, Ul } from './HelpComponents'

export function SettingsSection({
  theme,
  onThemeChange,
  holoPortraits,
  onHoloPortraitsChange,
  digitalRain,
  onDigitalRainChange,
  hideNpcPortraits,
  onHideNpcPortraitsChange,
  currencies,
  onCurrenciesChange,
  boxOfDoomHoldSec,
  setBoxOfDoomHoldSec,
  saveBoxOfDoomHoldSec,
  playerImagePadPct,
  savePlayerImagePadPct
}: {
  theme?: ThemeId
  onThemeChange?: (theme: ThemeId) => void
  holoPortraits: boolean
  onHoloPortraitsChange?: (enabled: boolean) => void
  digitalRain: boolean
  onDigitalRainChange?: (enabled: boolean) => void
  hideNpcPortraits: boolean
  onHideNpcPortraitsChange?: (hide: boolean) => void
  currencies?: CampaignCurrency[]
  onCurrenciesChange?: (currencies: CampaignCurrency[]) => void
  boxOfDoomHoldSec: string
  setBoxOfDoomHoldSec: (value: string) => void
  saveBoxOfDoomHoldSec: (raw: string) => void
  playerImagePadPct: number
  savePlayerImagePadPct: (raw: number | string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Sub>Campaign look</Sub>
        <p>
          Saved with this folder. You can also set it when you create a campaign, or from <Code>Start Here</Code>.
          The player TV stays black.
        </p>
        {theme && onThemeChange ? (
          <ul className="space-y-2">
            {THEME_IDS.map((id) => {
              const selected = theme === id
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onThemeChange(id)}
                    className={`w-full rounded border px-3 py-2 text-left ${
                      selected ? 'border-amber bg-amber/10' : 'border-line hover:border-amber'
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${selected ? 'text-amber' : 'text-parchment'}`}>
                      {THEME_LABELS[id]}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">{THEME_BLURBS[id]}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted">Open a campaign to choose a look.</p>
        )}
        {theme === 'scifi' && onHoloPortraitsChange ? (
          <label className="flex items-start gap-2 text-[13px] text-parchment/90">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={holoPortraits}
              onChange={(event) => onHoloPortraitsChange(event.target.checked)}
            />
            <span>
              <span className="font-semibold text-parchment">Hologram portraits</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                On by default for Sci-fi. Player, NPC, beast, and gear art as a projector plate. Places and maps
                stay as-is.
              </span>
            </span>
          </label>
        ) : null}
        {theme === 'matrix' && onDigitalRainChange ? (
          <label className="flex items-start gap-2 text-[13px] text-parchment/90">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={digitalRain}
              onChange={(event) => onDigitalRainChange(event.target.checked)}
            />
            <span>
              <span className="font-semibold text-parchment">Falling code</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                On by default for Digital rain. Slow wallpaper in the file list and notes. Header stays clear.
              </span>
            </span>
          </label>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-line/60 pt-4">
        <Sub>Treasure currencies</Sub>
        {onCurrenciesChange ? (
          <CurrenciesSettings currencies={currencies} onChange={onCurrenciesChange} />
        ) : (
          <p className="text-muted">Open a campaign to edit treasure currencies.</p>
        )}
      </div>

      <div className="space-y-2 border-t border-line/60 pt-4">
        <Sub>Artwork</Sub>
        <p className="text-[12px] leading-snug text-muted">
          Bundled artwork includes AI-generated NPC portrait picks in <Action>Tools → NPC</Action> and SRD
          monster, gear, and spell-school illustrations in Lookup and on sheets. Your own uploaded campaign art
          and stock place/shop art are not affected.
        </p>
        {onHideNpcPortraitsChange ? (
          <label className="flex items-start gap-2 text-[13px] text-parchment/90">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={hideNpcPortraits}
              onChange={(event) => onHideNpcPortraitsChange(event.target.checked)}
            />
            <span>
              <span className="font-semibold text-parchment">Hide bundled artwork</span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                Hides bundled AI portrait picks, SRD illustrations in Lookup, and default portraits on
                bestiary/gear/spell sheets that use bundled art. Turn off AI picks in Tools → NPC and skip bundled
                art when creating new notes.
              </span>
            </span>
          </label>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-line/60 pt-4">
        <Sub>Player TV</Sub>
        <p>
          <Action>Show to players</Action> stills scale up or down to fit by width or height, with a black inset so
          art is not clipped by the TV bezel. Maps stay edge-to-edge.
        </p>
        <label className="block text-[13px] text-parchment/90">
          <span className="font-semibold text-parchment">Picture padding</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">
            {playerImagePadPct}% on each side ({MIN_PLAYER_IMAGE_PAD_PCT}–{MAX_PLAYER_IMAGE_PAD_PCT}). Default{' '}
            {DEFAULT_PLAYER_IMAGE_PAD_PCT}%.
          </span>
          <input
            type="range"
            min={MIN_PLAYER_IMAGE_PAD_PCT}
            max={MAX_PLAYER_IMAGE_PAD_PCT}
            step={1}
            value={playerImagePadPct}
            aria-label="Picture padding"
            onChange={(event) => savePlayerImagePadPct(event.target.value)}
            className="mt-2 w-full"
          />
        </label>
      </div>

      <div className="space-y-2 border-t border-line/60 pt-4">
        <Sub>Dice</Sub>
        <p>
          Every roll in Tableside — dice tray, Box of Doom, stat block chips, combat initiative, Lookup attack
          lines, and Improvise damage — uses one shared randomiser. Each face on a die has the same chance of
          coming up. Rolls use the system&apos;s standard unpredictable source; they are not seeded from names,
          turn order, or anything you typed.
        </p>
        <Ul
          items={[
            <>
              <strong>Dice tray</strong> — d4–d100 and custom expressions such as <Code>2d6+3</Code>.{' '}
              <Action>Adv</Action> / <Action>Dis</Action> on a single d20 rolls two fair d20s and keeps the higher
              or lower.
            </>,
            <>
              <strong>Box of Doom</strong> — same fair d20(s). The tumbling faces before the reveal are cosmetic
              only; they never change the result.
            </>,
            <>
              <strong>Stat blocks & combat</strong> — to hit, saves, damage, and initiative d20s use the same
              engine.
            </>
          ]}
        />
        <p className="text-[12px] text-muted">
          Automated tests check that faces stay in range and that large samples match a fair distribution. There
          are no hidden rerolls or built-in bias toward players or the DM.
        </p>
        <label className="mt-2 block text-[13px] text-parchment/90">
          <span className="font-semibold text-parchment">Box of Doom — auto fade-out (seconds)</span>
          <span className="mt-0.5 block text-[12px] leading-snug text-muted">
            How long Success or Failure stays on the player TV before fading back if you do not click{' '}
            <Action>Fade out</Action>. Between {MIN_BOX_OF_DOOM_HOLD_MS / 1000} and{' '}
            {MAX_BOX_OF_DOOM_HOLD_MS / 1000} seconds.
          </span>
          <input
            type="number"
            min={MIN_BOX_OF_DOOM_HOLD_MS / 1000}
            max={MAX_BOX_OF_DOOM_HOLD_MS / 1000}
            step={1}
            value={boxOfDoomHoldSec}
            onChange={(event) => setBoxOfDoomHoldSec(event.target.value)}
            onBlur={() => saveBoxOfDoomHoldSec(boxOfDoomHoldSec)}
            className="mt-2 w-full rounded border border-line bg-ink px-2 py-1.5 text-sm text-parchment outline-none focus:border-amber"
          />
        </label>
      </div>
    </div>
  )
}
