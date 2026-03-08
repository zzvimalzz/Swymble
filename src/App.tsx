import { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useDeviceView } from './hooks/useDeviceView';
import { useRouteSeo } from './hooks/useRouteSeo';

const DesktopView = lazy(() => import('./views/DesktopView'));
const MobileTabletView = lazy(() => import('./views/MobileTabletView'));

function AppContent() {
  const isDesktopView = useDeviceView();
  useRouteSeo();

  return (
    <Suspense fallback={<div className="app-loading">Loading SWYMBLE...</div>}>
      {isDesktopView ? <DesktopView /> : <MobileTabletView />}
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
