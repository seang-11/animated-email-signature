import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Sparkles, Palette, GripVertical, Eye, Share2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';

const TOUR_KEY = 'sig-studio-tour-done';

interface Step {
  icon: React.ElementType;
  emoji: string;
  title: string;
  body: string;
  selector?: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    emoji: '👋',
    title: 'Welcome to Signature Studio!',
    body: "Let's take a quick 30-second tour so you know where everything is. You can replay this anytime from the help button in the header.",
  },
  {
    icon: Palette,
    emoji: '🎨',
    title: 'Theme — your brand colors & fonts',
    body: 'Start here! Pick your accent color, text color, and fonts. Everything updates live in the preview on the right.',
    selector: '[data-tour="theme"]',
  },
  {
    icon: GripVertical,
    emoji: '✋',
    title: 'Drag to rearrange',
    body: 'See the grip handle on each card? Drag any section up or down to change the order of your signature. Want company above your name? Just drag it up!',
    selector: '[data-tour="sections"]',
  },
  {
    icon: Eye,
    emoji: '👁️',
    title: 'Live Preview',
    body: "This is exactly how your signature will look in emails. You can also drag blocks directly here, or click any part to jump to its settings.",
    selector: '[data-tour="preview"]',
  },
  {
    icon: Share2,
    emoji: '📋',
    title: 'Export when you\'re ready',
    body: 'Switch to the Export tab to copy your signature. It always grabs the very latest version — paste it straight into Gmail, Outlook, or Apple Mail. You\'re all set!',
    selector: '[data-tour="toolbar"]',
  },
];

function highlightElement(selector?: string) {
  if (!selector) return;
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  el.classList.add('tour-highlight');
  return () => el.classList.remove('tour-highlight');
}

export function useTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  const start = useCallback(() => { setStep(0); setActive(true); }, []);
  const dismiss = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch {}
  }, []);

  // Auto-start on first run
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

export default function GuidedTour({ active, step, setStep, dismiss, total }: {
  active: boolean;
  step: number;
  setStep: (s: number) => void;
  dismiss: () => void;
  total: number;
}) {
  // Highlight the relevant element
  useEffect(() => {
    if (!active) return;
    const cleanup = highlightElement(STEPS[step]?.selector);
    return () => cleanup?.();
  }, [active, step]);

  const s = STEPS[step];
  if (!s) return null;

  const isFirst = step === 0;
  const isLast = step === total - 1;
  const Icon = s.icon;

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-[2px]"
            onClick={dismiss}
          />
          {/* Card */}
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-[100] w-[90vw] max-w-md -translate-x-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
          >
            <button onClick={dismiss} className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-lg">
                {s.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">Step {step + 1} of {total}</p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>

            {/* Progress dots */}
            <div className="mb-4 flex justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'}`}
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
