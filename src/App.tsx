import { Suspense, lazy } from 'react';
import { useDeviceView } from './hooks/useDeviceView';

const DesktopView = lazy(() => import('./views/DesktopView'));
const MobileTabletView = lazy(() => import('./views/MobileTabletView'));

function App() {
  const isDesktopView = useDeviceView();

  return (
    <Suspense fallback={<div className="app-loading">Loading SWYMBLE...</div>}>
      {isDesktopView ? <DesktopView /> : <MobileTabletView />}
    </Suspense>
  );
}

export default App;
