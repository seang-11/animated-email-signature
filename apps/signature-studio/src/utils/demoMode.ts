import { toast } from 'sonner';

const DEMO_TOAST_KEY = 'sig-studio-demo-toast-shown';

/** True when the platform rejected a write because this is a read-only marketplace demo. */
export function isDemoReadOnly(err: unknown): boolean {
  const msg = (err as any)?.message ?? String(err ?? '');
  return typeof msg === 'string' && msg.includes('DEMO_READ_ONLY');
}

/** Show the friendly demo notice. By default it shows once per session; force it for explicit actions. */
export function notifyDemo(force = false) {
  try {
    if (!force && sessionStorage.getItem(DEMO_TOAST_KEY)) return;
    sessionStorage.setItem(DEMO_TOAST_KEY, '1');
  } catch {}
  toast.info("You're viewing a demo — edits won't be saved. Copy this template to save your signatures.", {
    id: 'demo-mode',
    duration: 6000,
  });
}
