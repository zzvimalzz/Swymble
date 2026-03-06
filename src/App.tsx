import { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDeviceView } from './hooks/useDeviceView';

const DesktopView = lazy(() => import('./views/DesktopView'));
const MobileTabletView = lazy(() => import('./views/MobileTabletView'));

function App() {
  const isDesktopView = useDeviceView();

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="app-loading">Loading SWYMBLE...</div>}>
        {isDesktopView ? <DesktopView /> : <MobileTabletView />}
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
