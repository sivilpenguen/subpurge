/**
 * App-wide UI services: dialog (replaces ThemedAlert), undo toast, and a tiny
 * stack navigator for full-screen pages layered over the tabs.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { haptic } from '../platform/native';

// ─── Exit animations ─────────────────────────────────────────────────────────

/** Plays the `.closing` CSS animation before actually unmounting. */
export function useClosing(onClosed: () => void, ms = 230) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClosed, ms);
  }, [onClosed, ms]);
  return [closing, close] as const;
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

export type DialogAction = { label: string; variant?: 'primary' | 'destructive' | 'default'; onPress?: () => void };
export type DialogConfig = { title?: string; message?: string; actions: DialogAction[]; accent?: 'neutral' | 'destructive' };

function Dialog({ config, onClose }: { config: DialogConfig; onClose: () => void }) {
  const [closing, close] = useClosing(onClose, 180);
  const press = (action: DialogAction) => {
    close();
    action.onPress?.();
  };
  const two = config.actions.length === 2;
  return (
    <>
      <div className={`overlay${closing ? ' closing' : ''}`} onClick={close} />
      <div className="dialog-wrap" style={{ pointerEvents: 'none' }}>
        <div
          className={`dialog${config.accent === 'destructive' ? ' destructive' : ''}`}
          role="alertdialog"
          aria-modal="true"
          style={{ pointerEvents: 'auto', opacity: closing ? 0 : 1, transition: 'opacity .18s' }}
        >
          {config.title && <h3>{config.title}</h3>}
          {config.message && <p>{config.message}</p>}
          <div className={`dialog-actions${two ? ' two' : ''}`}>
            {config.actions.map(action => (
              <button
                key={action.label}
                className={`btn sm ${action.variant === 'primary' ? 'ink' : action.variant === 'destructive' ? 'danger' : 'ghost'}`}
                onClick={() => press(action)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string; actionLabel?: string; onAction?: () => void };

function ToastView({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, toast.onAction ? 4500 : 2200);
    return () => clearTimeout(timer);
  }, [toast, onDone]);
  return (
    <div className="toast" role="status">
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{toast.message}</span>
      {toast.onAction && (
        <button onClick={() => { toast.onAction?.(); onDone(); }}>{toast.actionLabel}</button>
      )}
    </div>
  );
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type Route = { name: 'edit'; id?: string } | { name: 'summary' };
type StackEntry = { key: number; route: Route; closing: boolean };

interface UICtx {
  showDialog: (config: DialogConfig) => void;
  showToast: (message: string, action?: { label: string; onPress: () => void }) => void;
  push: (route: Route) => void;
  pop: () => void;
}

const UIContext = createContext<UICtx | null>(null);

export function useUI(): UICtx {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}

export function UIProvider({ children, renderRoute }: { children: ReactNode; renderRoute: (route: Route, closing: boolean) => ReactNode }) {
  const [dialog, setDialog] = useState<{ id: number; config: DialogConfig } | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [stack, setStack] = useState<StackEntry[]>([]);
  const keyRef = useRef(0);

  const showDialog = useCallback((config: DialogConfig) => {
    if (config.accent === 'destructive') haptic.warning();
    setDialog({ id: ++keyRef.current, config });
  }, []);

  const showToast = useCallback((message: string, action?: { label: string; onPress: () => void }) => {
    setToast({ id: ++keyRef.current, message, actionLabel: action?.label, onAction: action?.onPress });
  }, []);

  const push = useCallback((route: Route) => {
    haptic.tap();
    setStack(s => [...s, { key: ++keyRef.current, route, closing: false }]);
  }, []);

  const pop = useCallback(() => {
    setStack(s => {
      const top = s[s.length - 1];
      if (!top || top.closing) return s;
      setTimeout(() => setStack(cur => cur.filter(e => e.key !== top.key)), 250);
      return s.map(e => (e.key === top.key ? { ...e, closing: true } : e));
    });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);
  const value = { showDialog, showToast, push, pop };

  return (
    <UIContext.Provider value={value}>
      {children}
      {stack.map(entry => (
        <div key={entry.key} style={{ display: 'contents' }}>{renderRoute(entry.route, entry.closing)}</div>
      ))}
      {toast && <ToastView key={toast.id} toast={toast} onDone={clearToast} />}
      {dialog && (
        <Dialog
          key={dialog.id}
          config={dialog.config}
          // An action may open a follow-up dialog; only clear if this one is still current.
          onClose={() => setDialog(d => (d?.id === dialog.id ? null : d))}
        />
      )}
    </UIContext.Provider>
  );
}

// ─── Bottom sheet ────────────────────────────────────────────────────────────

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: (close: () => void) => ReactNode }) {
  const [closing, close] = useClosing(onClose);
  return (
    <>
      <div className={`overlay${closing ? ' closing' : ''}`} onClick={close} />
      <div className={`sheet${closing ? ' closing' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="sheet-title">{title}</div>
        <div className="sheet-body">{children(close)}</div>
      </div>
    </>
  );
}
