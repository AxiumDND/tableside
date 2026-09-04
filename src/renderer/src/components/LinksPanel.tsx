import { TABLE_LINK_CATEGORIES } from '../../../shared/tableLinks'

export default function LinksPanel() {
  return (
    <div className="space-y-4 overflow-auto px-3 py-2 text-sm">
      <p className="text-[11px] leading-relaxed text-muted">
        Curated sites for prep and running D&amp;D at the table — rules, maps, art, advice, generators, music, and
        tables. Links open in your browser; Tableside does not embed or track them.
      </p>
      {TABLE_LINK_CATEGORIES.map((category) => (
        <section key={category.id}>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-dim">{category.title}</h3>
          <ul className="mt-2 space-y-2">
            {category.links.map((link) => (
              <li key={link.id} className="rounded border border-line bg-panel-2 px-3 py-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-amber hover:underline"
                >
                  {link.title}
                </a>
                <p className="mt-1 text-[12px] leading-snug text-parchment/80">{link.blurb}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
