import { useState, useEffect } from 'react';
import Widget from './features/Core/Widget/Widget';
import SelectionScreen from './features/Pokemon/SelectionScreen/SelectionScreen';
import { GameProvider } from './contexts/GameContext';

function App(): JSX.Element {
  const [route, setRoute] = useState<string>(window.location.hash);

  useEffect(() => {
    const handleHashChange = (): void => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  let content: JSX.Element;
  if (route === '#selection') {
    content = <SelectionScreen />;
  } else {
    content = <Widget />;
  }

  return (
    <GameProvider>
      {content}
    </GameProvider>
  );
}

export default App;
