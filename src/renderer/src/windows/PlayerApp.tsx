import { useEffect, useState } from 'react'
import type { PlayerState } from '../../../shared/types'
import { emptyPlayerState } from '../../../shared/types'
import PlayerView from '../components/PlayerView'

export default function PlayerApp() {
  const [state, setState] = useState<PlayerState>(emptyPlayerState())

  useEffect(() => {
    let alive = true
    window.tabledm.getPlayerState().then((s) => {
      if (alive) setState(s)
    })
    const off = window.tabledm.onPlayerState(setState)
    return () => {
      alive = false
      off()
    }
  }, [])

  return <PlayerView state={state} />
}
