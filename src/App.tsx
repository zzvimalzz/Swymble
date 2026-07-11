import { Suspense, lazy, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter } from 'react-router-dom';
import { useDeviceView } from './hooks/useDeviceView';
import { useRouteSeo } from './hooks/useRouteSeo';

const DesktopView = lazy(() => import('./views/DesktopView'));
const MobileTabletView = lazy(() => import('./views/MobileTabletView'));

// Keep the loader on screen long enough to register, then ease it out instead
// of letting Suspense swap it for the real content in the same frame it resolves.
const LOADER_MIN_VISIBLE_MS = 650;
const LOADER_FADE_MS = 500;

function AppLoader({ fadingOut }: { fadingOut: boolean }) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div
      className={`app-loading ${fadingOut ? 'app-loading--exit' : ''}`}
      role="status"
      aria-hidden={fadingOut || undefined}
    >
      <img
        className="app-loading-logo"
        src={`${baseUrl}images/white-logo.png`}
        alt=""
        aria-hidden="true"
        width={196}
        height={68}
      />
      <div className="loadingspinner" aria-hidden="true">
        <div id="square1" />
        <div id="square2" />
        <div id="square3" />
        <div id="square4" />
        <div id="square5" />
      </div>
      <span className="sw-visually-hidden">Loading</span>
    </div>
  );
}

function ContentReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);

  return null;
}

function AppContent() {
  const isDesktopView = useDeviceView();
  useRouteSeo();

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [loaderRemoved, setLoaderRemoved] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinTimeElapsed(true), LOADER_MIN_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const readyToFade = minTimeElapsed && contentMounted;

  useEffect(() => {
    if (!readyToFade) {
      return;
    }

    const timer = window.setTimeout(() => setLoaderRemoved(true), LOADER_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [readyToFade]);

  return (
    <>
      {!loaderRemoved && <AppLoader fadingOut={readyToFade} />}
      <Suspense fallback={null}>
        <ContentReadySignal onReady={() => setContentMounted(true)} />
        {isDesktopView ? <DesktopView /> : <MobileTabletView />}
      </Suspense>
    </>
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
