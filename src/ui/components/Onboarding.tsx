import { useLayoutEffect, useState } from 'react';
import { useStore } from '../../core/store/useSubscriptionStore';
import { haptic } from '../../platform/native';
import { useClosing } from '../shell';

export function Onboarding({ onFinish }: { onFinish: () => void }) {
  const { t, setOnboarded, loadDemoSubscriptions } = useStore();
  const [index, setIndex] = useState(0);
  const [closing, close] = useClosing(onFinish, 300);
  const slides = t.obSlides;
  const isLast = index === slides.length - 1;

  const finish = (withDemo: boolean) => {
    haptic.success();
    if (withDemo) loadDemoSubscriptions();
    setOnboarded();
    close();
  };

  return (
    <div className={`onboarding${closing ? ' closing' : ''}`}>
      <img className="ob-mark" src="badger.png" alt="Subpurge" />
      <div className="ob-slides">
        <div className="ob-slide" key={index}>
          <div className="ob-step">0{index + 1} / 0{slides.length}</div>
          <h1>{slides[index].title}</h1>
          <p>{slides[index].body}</p>
        </div>
        <div className="ob-dots" aria-hidden="true">
          {slides.map((_, i) => <i key={i} className={i === index ? 'on' : ''} />)}
        </div>
      </div>
      <div className="ob-actions">
        {isLast ? (
          <>
            <button className="btn primary block" onClick={() => finish(false)}>{t.obStart}</button>
            <button className="btn ghost block" onClick={() => finish(true)}>{t.obDemo}</button>
          </>
        ) : (
          <button className="btn ink block" onClick={() => { haptic.tap(); setIndex(i => i + 1); }}>{t.obContinue}</button>
        )}
      </div>
    </div>
  );
}

const COACH_TARGETS = ['add', 'row', 'purge'];

/** Spotlight tour over elements tagged with data-coach. Steps whose target isn't on screen are skipped. */
export function CoachMarks({ onDone }: { onDone: () => void }) {
  const { t } = useStore();
  // Resolve the steps once, when the tour opens.
  const [steps] = useState(() => COACH_TARGETS
    .map((target, i) => ({ target, ...t.coachSteps[i] }))
    .filter(step => document.querySelector(`[data-coach="${step.target}"]`)));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[index];
  const target = step?.target;

  useLayoutEffect(() => {
    if (!target) { onDone(); return; }
    const el = document.querySelector(`[data-coach="${target}"]`);
    el?.scrollIntoView({ block: 'nearest' });
    setRect(el ? el.getBoundingClientRect() : null);
  }, [target, onDone]);

  if (!step || !rect) return null;

  const pad = 6;
  const below = rect.top < window.innerHeight / 2;
  const next = () => {
    haptic.tap();
    if (index === steps.length - 1) onDone();
    else setIndex(i => i + 1);
  };

  return (
    <div className="coach" onClick={next}>
      <div
        className="coach-spot"
        style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }}
      />
      <div
        className="coach-tip"
        key={index}
        style={below ? { top: rect.bottom + 18 } : { bottom: window.innerHeight - rect.top + 18 }}
        onClick={e => e.stopPropagation()}
      >
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="coach-foot">
          <span className="eyebrow">{index + 1} / {steps.length}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {index < steps.length - 1 && <button className="btn sm ghost" onClick={onDone}>{t.coachSkip}</button>}
            <button className="btn sm primary" onClick={next}>{index === steps.length - 1 ? t.coachDone : t.coachNext}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
