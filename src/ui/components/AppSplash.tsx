import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { useEffect, useState } from 'react';
import { SPLASH_LINES } from '../../core/constants/i18nFlow';
import { useClosing } from '../shell';

const VISIBLE_MS = 3000;
// On iOS the native RA·KU screen covers the first ~2.3 s after launch; the
// WebView's clock starts a little after launch, so this lands ~3 s past it.
const NATIVE_END_MS = 4900;
const LINE_MS = 600;

/** Cold-start splash: the "stop paying" line cycling through all five languages. Tap to skip. */
export function AppSplash({ onDone }: { onDone: () => void }) {
  const [line, setLine] = useState(0);
  const [closing, close] = useClosing(onDone, 350);

  // Drop the native launch image only once this screen has painted: no blank frame in between.
  useEffect(() => {
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => {
      void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
    }));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const remaining = Capacitor.isNativePlatform()
      ? Math.max(NATIVE_END_MS - performance.now(), 2000)
      : VISIBLE_MS;
    const end = setTimeout(close, remaining);
    const tick = setInterval(() => setLine(i => (i + 1) % SPLASH_LINES.length), LINE_MS);
    return () => { clearTimeout(end); clearInterval(tick); };
  }, [close]);

  return (
    <div className={`app-splash${closing ? ' closing' : ''}`} onClick={close} role="presentation">
      <img className="app-splash-mark" src="badger.png" alt="SubPurge" />
      <p className="app-splash-line" key={line}>{SPLASH_LINES[line]}</p>
    </div>
  );
}
