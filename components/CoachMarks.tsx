import { createContext, useCallback, useContext, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getTheme } from '../constants/theme';
import { useStore } from '../store/useSubscriptionStore';

const { width: SW, height: SH } = Dimensions.get('window');
const PAD = 12;

export interface CoachStep {
  key: string;
  title: string;
  body: string;
  align?: 'top' | 'bottom';
}

interface Rect { x: number; y: number; w: number; h: number }

interface CoachMarksCtx {
  registerRef: (key: string, ref: View | null) => void;
  startTour: () => void;
}

const CoachMarksContext = createContext<CoachMarksCtx>({
  registerRef: () => {},
  startTour: () => {},
});

export function useCoachMarks() { return useContext(CoachMarksContext); }

const STEPS: CoachStep[] = [
  {
    key: 'addBtn',
    title: 'Abonelik ekle',
    body: 'İlk aboneliğini eklemek için bu butona bas.',
    align: 'bottom',
  },
  {
    key: 'subscriptionRow',
    title: 'Aksiyonlar',
    body: 'Bir aboneliği sola kaydırarak sonlandır, sağa kaydırarak bugün kullandım olarak işaretle. Noktalar menüsü daha fazla seçenek sunar.',
    align: 'bottom',
  },
  {
    key: 'purgeTab',
    title: 'Purge Mode',
    body: 'Kullanmadığın, zamlanmış ya da süresi dolmak üzere olan abonelikleri burada bulursun.',
    align: 'top',
  },
];

export function CoachMarksProvider({ children }: { children: React.ReactNode }) {
  const refs = useRef<Map<string, View>>(new Map());
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const { themeMode } = useStore();
  const theme = getTheme(themeMode);

  const registerRef = useCallback((key: string, ref: View | null) => {
    if (ref) refs.current.set(key, ref);
    else refs.current.delete(key);
  }, []);

  const measureStep = useCallback((idx: number, attempt = 0) => {
    const step = STEPS[idx];
    const ref = refs.current.get(step.key);
    if (!ref) { setRect(null); return; }
    ref.measure((_x, _y, w, h, px, py) => {
      if (w === 0 && h === 0) {
        if (attempt < 5) setTimeout(() => measureStep(idx, attempt + 1), 150);
        else setRect(null);
        return;
      }
      setRect({ x: px, y: py, w, h });
    });
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setVisible(true);
    requestAnimationFrame(() => measureStep(0));
  }, [measureStep]);

  const next = () => {
    let nextIdx = stepIndex + 1;
    // Ref'i olmayan adımları atla
    while (nextIdx < STEPS.length && !refs.current.get(STEPS[nextIdx].key)) {
      nextIdx++;
    }
    if (nextIdx >= STEPS.length) { setVisible(false); return; }
    setStepIndex(nextIdx);
    setTimeout(() => measureStep(nextIdx), 50);
  };

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const calloutAbove = rect ? (step.align === 'top' || rect.y + rect.h + 160 > SH) : false;
  const calloutTop = rect
    ? calloutAbove
      ? rect.y - 160 - PAD
      : rect.y + rect.h + PAD
    : SH / 2;

  return (
    <CoachMarksContext.Provider value={{ registerRef, startTour }}>
      {children}

      {visible && (
        <Modal transparent animationType="fade" statusBarTranslucent>
          {/* Dark overlay — 4 rects around the spotlight */}
          {rect ? (
            <>
              {/* top */}
              <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: rect.y - PAD }]} />
              {/* bottom */}
              <View style={[styles.overlay, { top: rect.y + rect.h + PAD, left: 0, right: 0, bottom: 0 }]} />
              {/* left */}
              <View style={[styles.overlay, { top: rect.y - PAD, left: 0, width: rect.x - PAD, height: rect.h + PAD * 2 }]} />
              {/* right */}
              <View style={[styles.overlay, { top: rect.y - PAD, left: rect.x + rect.w + PAD, right: 0, height: rect.h + PAD * 2 }]} />
              {/* spotlight border */}
              <View style={[styles.spotlight, {
                top: rect.y - PAD,
                left: rect.x - PAD,
                width: rect.w + PAD * 2,
                height: rect.h + PAD * 2,
              }]} />
            </>
          ) : (
            <View style={[styles.overlay, { top: 0, left: 0, right: 0, bottom: 0 }]} />
          )}

          {/* Callout */}
          <View style={[styles.callout, { backgroundColor: theme.card, borderColor: theme.border, top: calloutTop, left: 20, right: 20 }]}>
            <Text style={[styles.calloutTitle, { color: theme.text }]}>{step.title}</Text>
            <Text style={[styles.calloutBody, { color: theme.subtext }]}>{step.body}</Text>
            <View style={styles.calloutFooter}>
              <Text style={[styles.stepCount, { color: theme.subtext }]}>{stepIndex + 1} / {STEPS.length}</Text>
              <TouchableOpacity
                style={[styles.nextBtn, { backgroundColor: theme.text }]}
                onPress={next}
              >
                <Text style={[styles.nextBtnText, { color: theme.bg }]}>
                  {isLast ? 'Tamam' : 'Devam →'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Skip */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => setVisible(false)}>
            <Text style={styles.skipText}>Geç</Text>
          </TouchableOpacity>
        </Modal>
      )}
    </CoachMarksContext.Provider>
  );
}

export function CoachMarkTarget({ stepKey, children }: { stepKey: string; children: React.ReactElement }) {
  const { registerRef } = useCoachMarks();
  return (
    <>
      {/* @ts-ignore */}
      {require('react').cloneElement(children, {
        ref: (r: View | null) => registerRef(stepKey, r),
      })}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  spotlight: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  callout: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  calloutTitle: { fontSize: 16, fontWeight: '800' },
  calloutBody: { fontSize: 14, lineHeight: 22 },
  calloutFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  stepCount: { fontSize: 12 },
  nextBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 10 },
  nextBtnText: { fontSize: 14, fontWeight: '700' },
  skipBtn: { position: 'absolute', top: 56, right: 20, padding: 10 },
  skipText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
