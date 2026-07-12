import { Suspense, lazy, useEffect, useState, type CSSProperties } from 'react';
import { MotionConfig } from 'framer-motion';
import { BrowserRouter } from 'react-router-dom';
import { useDeviceView } from './hooks/useDeviceView';
import { useRouteSeo } from './hooks/useRouteSeo';
import { BUILD_COMMIT } from './utils/buildInfo';

const DesktopView = lazy(() => import('./views/DesktopView'));
const MobileTabletView = lazy(() => import('./views/MobileTabletView'));

// Keep the loader on screen long enough to register, then ease it out instead
// of letting Suspense swap it for the real content in the same frame it resolves.
// Return visits (same session) get a much shorter minimum — the boot is a moment,
// not a toll booth.
const LOADER_MIN_VISIBLE_MS = 650;
const LOADER_MIN_VISIBLE_FAST_MS = 300;
const LOADER_FADE_MS = 500;
const BOOT_SESSION_KEY = 'swymble-booted';

function hasBootedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(BOOT_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function markBooted(): void {
  try {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, '1');
  } catch {
    /* private mode — boot plays fully each visit, which is fine */
  }
}

// The boot sequence — the restyled loader. Every line is true: the real build
// hash and the actual readiness state (the volt hairline completes when content
// has genuinely mounted). Typing is CSS-only (steps()) so crawlers/reduced-motion
// get instant text; `fast` (repeat visits, headless) skips the typing entirely.
function BootLoader({ fadingOut, fast }: { fadingOut: boolean; fast: boolean }) {
  const lines = [
    `swymble-os · build ${BUILD_COMMIT}`,
    'mounting interface … ok',
    'ready.',
  ];

  return (
    <div
      className={`app-loading ${fadingOut ? 'app-loading--exit' : ''} ${fast ? 'app-loading--fast' : ''}`.trim()}
      role="status"
      aria-hidden={fadingOut || undefined}
    >
      <svg className="boot-glyph" viewBox="0 0 64 32" aria-hidden="true" fill="none">
        <path d="M2 9 C 18 1, 34 17, 62 7" />
        <path d="M2 17 C 20 9, 36 25, 62 15" />
        <path d="M2 25 C 22 17, 38 33, 62 23" />
      </svg>
      <div className="boot-lines" aria-hidden="true">
        {lines.map((line) => (
          <p key={line} className="boot-line" style={{ '--chars': line.length } as CSSProperties}>
            {line}
          </p>
        ))}
      </div>
      <div className={`boot-progress ${fadingOut ? 'boot-progress--done' : ''}`.trim()} aria-hidden="true" />
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

  // Headless snapshots and repeat visits get the fast path: typing skipped and
  // a shorter minimum, so the boot never taxes crawlers or returning visitors.
  const [fastBoot] = useState(() => hasBootedThisSession() || navigator.webdriver === true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [contentMounted, setContentMounted] = useState(false);
  const [loaderRemoved, setLoaderRemoved] = useState(false);

  useEffect(() => {
    const minVisible = fastBoot ? LOADER_MIN_VISIBLE_FAST_MS : LOADER_MIN_VISIBLE_MS;
    const timer = window.setTimeout(() => setMinTimeElapsed(true), minVisible);
    return () => window.clearTimeout(timer);
  }, [fastBoot]);

  const readyToFade = minTimeElapsed && contentMounted;

  useEffect(() => {
    if (!readyToFade) {
      return;
    }

    markBooted();
    const timer = window.setTimeout(() => setLoaderRemoved(true), LOADER_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [readyToFade]);

  return (
    <>
      {!loaderRemoved && <BootLoader fadingOut={readyToFade} fast={fastBoot} />}
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
