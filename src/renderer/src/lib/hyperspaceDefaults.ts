import defaultPlanet from '../assets/hyperspace-planet.webp'
import defaultShip from '../assets/hyperspace-ship.webp'

export const HYPERSPACE_DEFAULT_SHIP = defaultShip
export const HYPERSPACE_DEFAULT_PLANET = defaultPlanet

/** Vite/tabledm/data URLs are usable; a bare `ship.png` from the old template is not. */
function isPlayableSrc(src: string): boolean {
  return /^(tabledm:|data:|blob:|file:|https?:|\/)/i.test(src)
}

export function hyperspaceShipSrc(resolved: string | null | undefined): string {
  const src = resolved?.trim()
  return src && isPlayableSrc(src) ? src : HYPERSPACE_DEFAULT_SHIP
}

export function hyperspacePlanetSrc(resolved: string | null | undefined): string {
  const src = resolved?.trim()
  return src && isPlayableSrc(src) ? src : HYPERSPACE_DEFAULT_PLANET
}
