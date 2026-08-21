import DmApp from './windows/DmApp';
import PlayerApp from './windows/PlayerApp';

export default function App() {
  const hash = window.location.hash.replace('#/', '');
  if (hash.startsWith('player')) return <PlayerApp />;
  return <DmApp />;
}
