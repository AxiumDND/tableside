import { THEME_IDS, THEME_LABELS, type ThemeId } from '../../../shared/theme'

export default function ThemePicker({
  theme,
  onChange
}: {
  theme: ThemeId
  onChange: (theme: ThemeId) => void
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-muted">
      <span>Theme</span>
      <select
        value={theme}
        title="DM console theme — the player TV stays black"
        onChange={(event) => onChange(event.target.value as ThemeId)}
        className="max-w-[9.5rem] rounded border border-line bg-ink px-2 py-1 text-sm text-parchment outline-none hover:border-amber focus:border-amber"
      >
        {THEME_IDS.map((id) => (
          <option key={id} value={id}>
            {THEME_LABELS[id]}
          </option>
        ))}
      </select>
    </label>
  )
}
