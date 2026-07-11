import { Suspense, lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter } from 'react-router-dom';
import { useDeviceView } from './hooks/useDeviceView';
import { useRouteSeo } from './hooks/useRouteSeo';

const DesktopView = lazy(() => import('./views/DesktopView'));
const MobileTabletView = lazy(() => import('./views/MobileTabletView'));

function AppLoader() {
  return (
    <div className="app-loading">
      <div className="app-loading-mark" data-text="SWYMBLE">
        SWYMBLE
      </div>
      <div className="app-loading-track">
        <div className="app-loading-bar" />
      </div>
    </div>
  );
}

function AppContent() {
  const isDesktopView = useDeviceView();
  useRouteSeo();

  return (
    <Suspense fallback={<AppLoader />}>
      {isDesktopView ? <DesktopView /> : <MobileTabletView />}
    </Suspense>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <AppContent />
      </BrowserRouter>
    </MotionConfig>
  );
}

export default App;
