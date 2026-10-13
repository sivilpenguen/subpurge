import { useRef, useState, type ReactNode } from 'react';
import { haptic } from '../../platform/native';

const THRESHOLD = 88;

interface Props {
  leftLabel: string;   // revealed when swiping left (destructive)
  rightLabel: string;  // revealed when swiping right (positive)
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  children: ReactNode;
}

/**
 * Horizontal swipe with two actions. Vertical drags fall through to the
 * scroll container (touch-action: pan-y), and a drag never fires a click.
 */
export function SwipeRow({ leftLabel, rightLabel, onSwipeLeft, onSwipeRight, children }: Props) {
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const axis = useRef<'x' | 'y' | null>(null);
  const armed = useRef(false);
  const suppressClick = useRef(false);

  const reset = () => {
    setAnimating(true);
    setDx(0);
    setTimeout(() => setAnimating(false), 220);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    axis.current = null;
    armed.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!axis.current) {
      if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
      axis.current = Math.abs(mx) > Math.abs(my) ? 'x' : 'y';
      if (axis.current === 'x') (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (axis.current !== 'x') return;
    suppressClick.current = true;
    // Rubber-band past the threshold.
    const sign = Math.sign(mx);
    const abs = Math.abs(mx);
    const eased = abs > THRESHOLD ? THRESHOLD + (abs - THRESHOLD) * 0.35 : abs;
    setDx(sign * eased);
    const nowArmed = abs > THRESHOLD;
    if (nowArmed !== armed.current) {
      armed.current = nowArmed;
      if (nowArmed) haptic.tap();
    }
  };

  const finish = () => {
    const wasX = axis.current === 'x';
    start.current = null;
    axis.current = null;
    if (!wasX) return;
    const direction = dx;
    if (armed.current) {
      setAnimating(true);
      setDx(Math.sign(direction) * window.innerWidth);
      setTimeout(() => {
        if (direction < 0) onSwipeLeft();
        else onSwipeRight();
        setAnimating(false);
        setDx(0);
      }, 200);
    } else {
      reset();
    }
    armed.current = false;
    setTimeout(() => { suppressClick.current = false; }, 0);
  };

  const progress = Math.min(1, Math.abs(dx) / THRESHOLD);

  return (
    <div
      className="swipe"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      onClickCapture={e => {
        if (suppressClick.current) {
          e.stopPropagation();
          e.preventDefault();
        }
      }}
    >
      <div className="swipe-action right" style={{ opacity: dx > 0 ? progress : 0 }} aria-hidden="true">{rightLabel}</div>
      <div className="swipe-action left" style={{ opacity: dx < 0 ? progress : 0 }} aria-hidden="true">{leftLabel}</div>
      <div
        className="swipe-content"
        style={{
          transform: `translateX(${dx}px)`,
          transition: animating ? 'transform .22s cubic-bezier(.2,.8,.2,1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
