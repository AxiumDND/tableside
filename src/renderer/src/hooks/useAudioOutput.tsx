import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const AudioOutputContext = createContext('')

export function AudioOutputProvider({ children }: { children: ReactNode }) {
  const [outputDeviceId, setOutputDeviceId] = useState('')

  useEffect(() => {
    let alive = true
    void window.tabledm.getMixer().then((mixer) => {
      if (alive) setOutputDeviceId(mixer.prefs.outputDeviceId)
    })
    const off = window.tabledm.onMixerState((mixer) => {
      setOutputDeviceId(mixer.prefs.outputDeviceId)
    })
    return () => {
      alive = false
      off()
    }
  }, [])

  return <AudioOutputContext.Provider value={outputDeviceId}>{children}</AudioOutputContext.Provider>
}

export function useAudioOutput(): string {
  return useContext(AudioOutputContext)
}
