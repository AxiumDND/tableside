import { createContext, useContext, type ReactNode } from 'react'

const HideBundledArtworkContext = createContext(false)

export function HideBundledArtworkProvider({
  hide,
  children
}: {
  hide: boolean
  children: ReactNode
}) {
  return <HideBundledArtworkContext.Provider value={hide}>{children}</HideBundledArtworkContext.Provider>
}

/** When true, hide bundled SRD illustrations and AI portrait picks. */
export function useHideBundledArtwork(): boolean {
  return useContext(HideBundledArtworkContext)
}
