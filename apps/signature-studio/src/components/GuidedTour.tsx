import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles } from 'lucide-react';
import { Button } from '@project/components/ui/button';

const TOUR_KEY = 'sig-studio-tour-done';
const EDGE_MARGIN = 16;

interface Step {
  emoji: string;
  title: string;
  body: string;
  selector?: string;
  /** Prefer card placement relative to element — defaults to 'below' */
  placement?: 'below' | 'above';
}

const STEPS: Step[] = [
  {
    emoji: '👋',
    title: 'Welcome to Signature Studio!',
    body: "Let's take a quick tour so you know where everything is. It'll only take a minute, and you can replay it anytime from the \"Show me around\" button in the header.",
  },
  {
    emoji: '📝',
    title: 'Your signatures',
    body: 'This bar shows which signature you\'re editing right now. Click the dropdown to switch between signatures, or hit "Create new signature" to start a fresh one. You can have as many as you need — one per role, team, or brand.',
    selector: '[data-tour="switcher"]',
    placement: 'below',
  },
  {
    emoji: '🎨',
    title: 'Theme — your brand colors & fonts',
    body: 'Start here! Your accent color shows up on your name, the accent bar, and CTA button. Text color sets the default for all body text. Pick fonts, adjust sizes, and fine-tune spacing — everything updates live in the preview.',
    selector: '[data-tour="theme"]',
    placement: 'below',
  },
  {
    emoji: '✋',
    title: 'Section cards — drag to rearrange',
    body: 'Each card is a part of your signature — name, company, logo, contacts, and so on. Grab the grip handle on the left and drag any card up or down to rearrange the order. Click a card to open its settings.',
    selector: '[data-tour="sections"]',
    placement: 'below',
  },
  {
    emoji: '📐',
    title: 'Layout & zones',
    body: 'Open the Layout panel to pick a preset (Logo Left, Stacked, Compact) or drag blocks between the Left, Main, and Bottom zones for a fully custom arrangement. Left puts things in a sidebar column, Bottom spans the full width underneath.',
    selector: '[data-tour="layout"]',
    placement: 'below',
  },
  {
    emoji: '👁️',
    title: 'Live preview — drag here too!',
    body: "This is exactly how your signature will look in emails. You can drag blocks directly here to rearrange them, or click any part to jump to its settings on the left. It updates in real time as you make changes.",
    selector: '[data-tour="preview"]',
    placement: 'above',
  },
  {
    emoji: '↩️',
    title: 'Undo, redo & autosave',
    body: "Every change is saved automatically. Made a mistake? Use Undo/Redo or the Revert button to go back to the last saved version. Keyboard shortcuts work too — Ctrl+Z to undo, Ctrl+S to save immediately.",
    selector: '[data-tour="undo"]',
    placement: 'below',
  },
  {
    emoji: '📋',
    title: 'Export when you\'re ready',
    body: "Switch to the Export tab to copy your finished signature. \"Copy signature\" is the one most people want — it pastes formatted HTML directly into Gmail, Outlook, or Apple Mail. Every copy always regenerates from your latest edits, so you'll never paste something stale.",
    selector: '[data-tour="toolbar"]',
    placement: 'below',
  },
];

export function useTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  const start = useCallback(() => { setStep(0); setActive(true); }, []);
  const dismiss = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch {}
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        const t = setTimeout(start, 600);
        return () => clearTimeout(t);
      }
    } catch {}
  }, [start]);

  return { active, step, setStep, start, dismiss, total: STEPS.length };
}

/* ------------------------------------------------------------------ */
/*  Robust card positioning with viewport clamping & scroll tracking  */
/* ------------------------------------------------------------------ */

type CardPos = { top: number; left: number };

function computePosition(
  elRect: DOMRect,
  cardW: number,
  cardH: number,
  viewW: number,
  viewH: number,
  preferAbove: boolean,
): CardPos {
  const gap = 12;

  // Horizontal: center on element, clamp to viewport
  let left = elRect.left + elRect.width / 2 - cardW / 2;
  left = Math.max(EDGE_MARGIN, Math.min(left, viewW - cardW - EDGE_MARGIN));

  const spaceBelow = viewH - elRect.bottom - gap;
  const spaceAbove = elRect.top - gap;

  // Try preferred side first, then the other, then fixed center
  if (preferAbove && spaceAbove >= cardH + EDGE_MARGIN) {
    return { top: elRect.top - gap - cardH, left };
  }
  if (!preferAbove && spaceBelow >= cardH + EDGE_MARGIN) {
    return { top: elRect.bottom + gap, left };
  }
  // Try the opposite side
  if (!preferAbove && spaceAbove >= cardH + EDGE_MARGIN) {
    return { top: elRect.top - gap - cardH, left };
  }
  if (preferAbove && spaceBelow >= cardH + EDGE_MARGIN) {
    return { top: elRect.bottom + gap, left };
  }

  // Neither side fits — place fixed at center-bottom, guaranteed on-screen
  return {
    top: Math.max(EDGE_MARGIN, viewH - cardH - EDGE_MARGIN),
    left: Math.max(EDGE_MARGIN, (viewW - cardW) / 2),
  };
}

function useCardPosition(active: boolean, step: number) {
  const [pos, setPos] = useState<CardPos | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // Track whether we've done the initial measurement after scroll settles
  const scrollDoneRef = useRef(false);

  const measure = useCallback(() => {
    const s = STEPS[step];
    if (!active || !s?.selector) { setPos(null); return; }
    const el = document.querySelector(s.selector);
    if (!el) { setPos(null); return; }

    const rect = el.getBoundingClientRect();
    const cardEl = cardRef.current;
    const cardW = cardEl ? cardEl.offsetWidth : Math.min(window.innerWidth * 0.9, 448);
    const cardH = cardEl ? cardEl.offsetHeight : 280;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    const preferAbove = s.placement === 'above';
    setPos(computePosition(rect, cardW, cardH, viewW, viewH, preferAbove));
  }, [active, step]);

  // Scroll the target into view, then measure after scroll settles
  useEffect(() => {
    if (!active) { setPos(null); return; }
    const s = STEPS[step];
    if (!s?.selector) { setPos(null); return; }
    scrollDoneRef.current = false;

    // Initial rough measure so card appears immediately (will refine)
    measure();

    // Wait for scrollIntoView to finish (~400ms is generous for smooth scroll)
    const t = setTimeout(() => {
      scrollDoneRef.current = true;
      measure();
    }, 420);

    return () => clearTimeout(t);
  }, [active, step, measure]);

  // Re-measure on actual card render (height now known) and on scroll/resize
  useLayoutEffect(() => {
    if (!active) return;
    // Once the card mounts / re-renders, re-measure with real height
    const raf = requestAnimationFrame(measure);

    const handler = () => measure();
    window.addEventListener('scroll', handler, true); // capture so we catch inner scrolls
    window.addEventListener('resize', handler);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [active, step, measure]);

  return { pos, cardRef };
}

export default function GuidedTour({ active, step, setStep, dismiss, total }: {
  active: boolean;
  step: number;
  setStep: (s: number) => void;
  dismiss: () => void;
  total: number;
}) {
  // Highlight element
  useEffect(() => {
    if (!active) return;
    const s = STEPS[step];
    if (!s?.selector) return;
    const el = document.querySelector(s.selector);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    el.classList.add('tour-highlight');
    return () => el.classList.remove('tour-highlight');
  }, [active, step]);

  const { pos, cardRef } = useCardPosition(active, step);
  const s = STEPS[step];
  if (!s) return null;

  const isFirst = step === 0;
  const isLast = step === total - 1;
  const hasSelector = !!s.selector;

  // Card positioning style
  const cardStyle: React.CSSProperties = hasSelector && pos
    ? { position: 'fixed', top: pos.top, left: pos.left }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Dim backdrop — no blur so you can still read the page */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/40"
            onClick={dismiss}
          />
          {/* Card */}
          <motion.div
            key={step}
            ref={cardRef}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="z-[101] w-[90vw] max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
            style={cardStyle}
          >
            <button onClick={dismiss} className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">
                {s.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">Step {step + 1} of {total}</p>
              </div>
            </div>

            <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>

            {/* Progress dots */}
            <div className="mb-3 flex justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-5 bg-primary' : i < step ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                disabled={isFirst}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>

              <button onClick={dismiss} className="text-[11px] text-muted-foreground hover:text-foreground">
                Skip tour
              </button>

              {isLast ? (
                <Button size="sm" onClick={dismiss} className="gap-1 text-xs">
                  <Sparkles className="h-3.5 w-3.5" /> Let's go!
                </Button>
              ) : (
                <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1 text-xs">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
