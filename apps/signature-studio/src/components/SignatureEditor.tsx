import { useState, useEffect, useCallback, useRef } from 'react';
import { loadSignature } from 'zitejs/api';
import { saveSignature } from 'zitejs/api';
import { useDebouncedCallback } from 'use-debounce';
import { toast } from 'sonner';
import { Pen, Palette, Share2 } from 'lucide-react';
import ContentTab from './ContentTab';
import DesignTab from './DesignTab';
import ExportTab from './ExportTab';
import SignaturePreview from './SignaturePreview';

export type SigData = Record<string, any>;

export default function SignatureEditor() {
  const [tab, setTab] = useState<'content' | 'design' | 'export'>('content');
  const [sig, setSig] = useState<SigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
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
      setSavedAt(new Date());
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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!sig) return <div className="p-8 text-center text-muted-foreground">Could not load signature.</div>;

  const tabs = [
    { key: 'content' as const, label: 'Content', icon: Pen },
    { key: 'design' as const, label: 'Design', icon: Palette },
    { key: 'export' as const, label: 'Export', icon: Share2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <h1 className="text-lg font-semibold text-foreground">Signature Studio</h1>
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved {savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl gap-6 px-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            {tab === 'content' && <ContentTab sig={sig} updateField={updateField} />}
            {tab === 'design' && <DesignTab sig={sig} updateField={updateField} />}
            {tab === 'export' && <ExportTab sig={sig} />}
          </div>
          <div className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live Preview</p>
            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <SignaturePreview sig={sig} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
