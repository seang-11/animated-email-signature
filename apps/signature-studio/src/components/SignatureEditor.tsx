import { useState, useEffect, useCallback, useRef } from 'react';
import { loadSignature } from 'zitejs/api';
import { saveSignature } from 'zitejs/api';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { Pen, Palette, Share2, Check } from 'lucide-react';
import ContentTab from './ContentTab';
import DesignTab from './DesignTab';
import ExportTab from './ExportTab';
import SignaturePreview from './SignaturePreview';

export type SigData = Record<string, any>;

const tabs = [
  { key: 'content' as const, label: 'Content', icon: Pen },
  { key: 'design' as const, label: 'Design', icon: Palette },
  { key: 'export' as const, label: 'Export', icon: Share2 },
];

export default function SignatureEditor() {
  const [tab, setTab] = useState<'content' | 'design' | 'export'>('content');
  const [sig, setSig] = useState<SigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const sigRef = useRef(sig);
  sigRef.current = sig;

  useEffect(() => {
    loadSignature({}).then((res: any) => {
      setSig(res.signature);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load signature');
      setLoading(false);
    });
  }, []);

  const debouncedSave = useDebouncedCallback((data: SigData) => {
    if (!data.id) return;
    const { id, lastUpdated, ...fields } = data;
    saveSignature({ id, fields }).then(() => {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }).catch(() => toast.error('Save failed'));
  }, 800);

  const updateField = useCallback((key: string, value: any) => {
    setSig(prev => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      debouncedSave(next);
      return next;
    });
  }, [debouncedSave]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!sig) return <div className="p-8 text-center text-muted-foreground">Could not load signature.</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header — gradient */}
      <header className="bg-gradient-to-r from-secondary to-primary">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Pen className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">Signature Studio</h1>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-500 ${justSaved ? 'bg-white/20 text-white' : 'bg-transparent text-white/60'}`}>
            {justSaved ? (
              <>
                <Check className="h-3.5 w-3.5 animate-bounce" />
                Saved
              </>
            ) : (
              <span>Auto-saving</span>
            )}
          </div>
        </div>
      </header>

      {/* Segmented tab control */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="inline-flex rounded-lg bg-muted p-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  tab === t.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left: editor panel */}
          <div className="transition-opacity duration-200">
            {tab === 'content' && <ContentTab sig={sig} updateField={updateField} />}
            {tab === 'design' && <DesignTab sig={sig} updateField={updateField} />}
            {tab === 'export' && <ExportTab sig={sig} />}
          </div>

          {/* Right: email preview frame */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
              {/* Faux window titlebar */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-muted-foreground">New Message</span>
              </div>
              {/* Faux email header */}
              <div className="space-y-1 border-b border-border bg-muted/20 px-5 py-3 text-xs text-muted-foreground">
                <div><span className="font-medium text-foreground/60">From:</span> {sig.fullName || 'You'} &lt;{sig.emailAddress || 'you@company.com'}&gt;</div>
                <div><span className="font-medium text-foreground/60">Subject:</span> <span className="italic text-muted-foreground/60">Your subject here</span></div>
              </div>
              {/* Email body area */}
              <div className="bg-white px-5 py-4">
                <div className="mb-6 space-y-1.5 text-sm text-gray-400">
                  <div className="h-2.5 w-3/4 rounded bg-gray-100" />
                  <div className="h-2.5 w-1/2 rounded bg-gray-100" />
                  <div className="h-2.5 w-2/3 rounded bg-gray-100" />
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <SignaturePreview sig={sig} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
