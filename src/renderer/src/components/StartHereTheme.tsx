import ThemePicker from './ThemePicker'
import type { ThemeId } from '../../../shared/theme'

export default function StartHereTheme({
  theme,
  onChange,
  holoPortraits = false,
  onHoloPortraitsChange,
  digitalRain = false,
  onDigitalRainChange
}: {
  theme: ThemeId
  onChange: (theme: ThemeId) => void
  holoPortraits?: boolean
  onHoloPortraitsChange?: (enabled: boolean) => void
  digitalRain?: boolean
  onDigitalRainChange?: (enabled: boolean) => void
}) {
  return (
    <div className="mb-4 rounded border border-line/80 bg-ink/40 px-3 py-2.5">
      <div className="text-sm font-semibold text-amber">Campaign look</div>
      <p className="mt-1 text-[13px] leading-relaxed text-parchment/85">
        Saved in this folder and remembered when you open it. The player TV stays black.
      </p>
      <div className="mt-2">
        <ThemePicker theme={theme} onChange={onChange} />
      </div>
      {theme === 'scifi' && onHoloPortraitsChange ? (
        <label className="mt-3 flex items-start gap-2 text-[13px] text-parchment/90">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={holoPortraits}
            onChange={(event) => onHoloPortraitsChange(event.target.checked)}
          />
          <span>
            <span className="font-semibold text-parchment">Hologram portraits</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">
              Player, NPC, beast, and gear art as a projector plate.
            </span>
          </span>
        </label>
      ) : null}
      {theme === 'matrix' && onDigitalRainChange ? (
        <label className="mt-3 flex items-start gap-2 text-[13px] text-parchment/90">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={digitalRain}
            onChange={(event) => onDigitalRainChange(event.target.checked)}
          />
          <span>
            <span className="font-semibold text-parchment">Falling code</span>
            <span className="mt-0.5 block text-[12px] leading-snug text-muted">
              Slow wallpaper in the file list and notes.
            </span>
          </span>
        </label>
      ) : null}
    </div>
  )
}
