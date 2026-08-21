import { ErrorBoundary } from './components/ErrorBoundary';
import DmApp from './windows/DmApp';
import PlayerApp from './windows/PlayerApp';

export default function App() {
  const hash = window.location.hash.replace('#/', '');
  
  return (
    <ErrorBoundary>
      {hash.startsWith('player') ? <PlayerApp /> : <DmApp />}
    </ErrorBoundary>
  );
}
