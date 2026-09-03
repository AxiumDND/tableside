import DmApp from './windows/DmApp'
import PlayerApp from './windows/PlayerApp'
import { AudioOutputProvider } from './hooks/useAudioOutput'

export default function App() {
  const hash = window.location.hash.replace('#/', '')
  return (
    <AudioOutputProvider>
      {hash.startsWith('player') ? <PlayerApp /> : <DmApp />}
    </AudioOutputProvider>
  )
}
